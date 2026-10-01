import { prisma } from "@/lib/prisma";
import { ShipmentStatus, Role, Prisma } from "@prisma/client";
import { canTransition, isOtpGatedTransition } from "@/lib/stateMachine";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/lib/errors";
import {
  generate6DigitOtp,
  hashOtp,
  verifyOtpHash,
  getOtpExpiresAt,
  sendOtpEmail,
} from "./otpService";
import { emitShipmentChanged } from "@/lib/emit";
import crypto from "crypto";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CreateShipmentInput {
  customerId?: string; // If customer creates, will be forced to user.id; if staff/admin, can specify
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originHubId?: string | null;
  destHubId?: string | null;
  weightKg: number;
  type: string;
}

export interface GetShipmentsFilter {
  status?: ShipmentStatus;
  q?: string;
  page?: number;
  limit?: number;
}

function generateTrackingId(): string {
  // Generate SHP- + 8 uppercase alphanumeric characters
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SHP-${rand}`;
}

export async function createShipment(
  input: CreateShipmentInput,
  currentUser: SessionUser
) {
  // 1. Resolve actor user in DB (handles stale session tokens from re-seeding)
  let actorUserId = currentUser.id;
  const userById = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (!userById && currentUser.email) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: currentUser.email.toLowerCase().trim() },
    });
    if (userByEmail) {
      actorUserId = userByEmail.id;
    }
  }

  // 2. Resolve customerId (customers can only create for themselves)
  let customerId =
    currentUser.role === Role.CUSTOMER ? actorUserId : input.customerId || actorUserId;

  const customerExists = await prisma.user.findUnique({
    where: { id: customerId },
  });

  if (!customerExists) {
    const customerByEmail = await prisma.user.findUnique({
      where: { email: input.senderEmail.toLowerCase().trim() },
    });
    if (customerByEmail) {
      customerId = customerByEmail.id;
    } else {
      const fallbackCustomer = await prisma.user.findFirst({
        where: { role: Role.CUSTOMER },
      });
      customerId = fallbackCustomer?.id || actorUserId;
    }
  }

  // Ensure unique tracking ID
  let trackingId = generateTrackingId();
  let exists = await prisma.shipment.findUnique({ where: { trackingId } });
  while (exists) {
    trackingId = generateTrackingId();
    exists = await prisma.shipment.findUnique({ where: { trackingId } });
  }

  const result = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        trackingId,
        customerId,
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        senderAddress: input.senderAddress,
        receiverName: input.receiverName,
        receiverEmail: input.receiverEmail,
        receiverPhone: input.receiverPhone,
        receiverAddress: input.receiverAddress,
        originLat: input.originLat,
        originLng: input.originLng,
        destLat: input.destLat,
        destLng: input.destLng,
        originHubId: input.originHubId || null,
        destHubId: input.destHubId || null,
        weightKg: input.weightKg,
        type: input.type,
        status: ShipmentStatus.CREATED,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        originHub: true,
        destHub: true,
      },
    });

    const event = await tx.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment registered in system",
        lat: input.originLat,
        lng: input.originLng,
        createdByUserId: actorUserId,
      },
    });

    return { shipment, event };
  });

  // Realtime hook
  emitShipmentChanged(result.shipment, result.event);

  return result.shipment;
}

export async function getShipments(
  currentUser: SessionUser,
  filters: GetShipmentsFilter = {}
) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ShipmentWhereInput = {};

  // Role data isolation
  if (currentUser.role === Role.CUSTOMER) {
    where.customerId = currentUser.id;
  } else if (currentUser.role === Role.DRIVER) {
    where.assignedDriverId = currentUser.id;
  }

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Search filter
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { trackingId: { contains: q, mode: "insensitive" } },
      { senderName: { contains: q, mode: "insensitive" } },
      { receiverName: { contains: q, mode: "insensitive" } },
      { senderEmail: { contains: q, mode: "insensitive" } },
      { receiverEmail: { contains: q, mode: "insensitive" } },
      { receiverAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedDriver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        originHub: true,
        destHub: true,
      },
    }),
  ]);

  return {
    shipments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getShipmentById(id: string, currentUser: SessionUser) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      assignedDriver: { select: { id: true, name: true, email: true, phone: true, isOnline: true } },
      vehicle: true,
      originHub: true,
      destHub: true,
      events: {
        orderBy: { createdAt: "desc" },
        include: {
          createdByUser: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  // Role-based customer isolation
  if (currentUser.role === Role.CUSTOMER && shipment.customerId !== currentUser.id) {
    throw new ForbiddenError("You do not have permission to view this shipment");
  }

  // Driver isolation
  if (currentUser.role === Role.DRIVER && shipment.assignedDriverId !== currentUser.id) {
    throw new ForbiddenError("You are not assigned to this shipment");
  }

  return shipment;
}

export async function updateShipmentStatusGeneric(
  id: string,
  input: { status: ShipmentStatus; note?: string; lat?: number; lng?: number },
  currentUser: SessionUser
) {
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  // Permission check: STAFF, ADMIN, or assigned DRIVER
  if (
    currentUser.role !== Role.STAFF &&
    currentUser.role !== Role.ADMIN &&
    (currentUser.role !== Role.DRIVER || shipment.assignedDriverId !== currentUser.id)
  ) {
    throw new ForbiddenError("Not authorized to update shipment status");
  }

  // CRITICAL RULE: Reject transitions requiring OTP verification
  if (isOtpGatedTransition(shipment.status, input.status) || input.status === "PICKED_UP" || input.status === "DELIVERED") {
    throw new AppError(
      `Status transition to ${input.status} requires OTP verification via the OTP endpoint`,
      400
    );
  }

  // Check state machine validity
  if (!canTransition(shipment.status, input.status)) {
    throw new ConflictError(
      `Invalid status transition from ${shipment.status} to ${input.status}`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id },
      data: { status: input.status },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedDriver: { select: { id: true, name: true, email: true } },
      },
    });

    const event = await tx.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: input.status,
        note: input.note || `Status updated to ${input.status}`,
        lat: input.lat,
        lng: input.lng,
        createdByUserId: currentUser.id,
      },
    });

    return { updated, event };
  });

  emitShipmentChanged(result.updated, result.event);

  return result.updated;
}

export async function assignDriverAndVehicle(
  id: string,
  input: { driverId: string; vehicleId?: string | null },
  currentUser: SessionUser
) {
  if (currentUser.role !== Role.STAFF && currentUser.role !== Role.ADMIN) {
    throw new ForbiddenError("Only staff and admin can assign drivers");
  }

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  const driver = await prisma.user.findUnique({ where: { id: input.driverId } });
  if (!driver || driver.role !== Role.DRIVER) {
    throw new AppError("Invalid driver ID", 400);
  }

  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) {
      throw new AppError("Invalid vehicle ID", 400);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id },
      data: {
        assignedDriverId: input.driverId,
        vehicleId: input.vehicleId || null,
      },
      include: {
        assignedDriver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
      },
    });

    const event = await tx.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: shipment.status,
        note: `Driver ${driver.name} assigned${input.vehicleId ? " with vehicle" : ""}`,
        createdByUserId: currentUser.id,
      },
    });

    return { updated, event };
  });

  emitShipmentChanged(result.updated, result.event);

  return result.updated;
}

export async function sendShipmentOtp(
  id: string,
  stage: "pickup" | "delivery",
  currentUser: SessionUser
) {
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  if (
    currentUser.role !== Role.STAFF &&
    currentUser.role !== Role.ADMIN &&
    (currentUser.role !== Role.DRIVER || shipment.assignedDriverId !== currentUser.id)
  ) {
    throw new ForbiddenError("Not authorized to send OTP for this shipment");
  }

  let recipientEmail: string;

  if (stage === "pickup") {
    if (shipment.status !== ShipmentStatus.CREATED) {
      throw new ConflictError(
        `Pickup OTP can only be sent when status is CREATED (current: ${shipment.status})`
      );
    }
    recipientEmail = shipment.senderEmail;
  } else if (stage === "delivery") {
    if (shipment.status !== ShipmentStatus.OUT_FOR_DELIVERY) {
      throw new ConflictError(
        `Delivery OTP can only be sent when status is OUT_FOR_DELIVERY (current: ${shipment.status})`
      );
    }
    recipientEmail = shipment.receiverEmail;
  } else {
    throw new AppError("Invalid OTP stage. Must be 'pickup' or 'delivery'", 400);
  }

  const otp = generate6DigitOtp();
  const hash = hashOtp(otp);
  const expiresAt = getOtpExpiresAt();

  if (stage === "pickup") {
    await prisma.shipment.update({
      where: { id },
      data: {
        pickupOtpHash: hash,
        pickupOtpExpiresAt: expiresAt,
      },
    });
  } else {
    await prisma.shipment.update({
      where: { id },
      data: {
        deliveryOtpHash: hash,
        deliveryOtpExpiresAt: expiresAt,
      },
    });
  }

  await sendOtpEmail({
    email: recipientEmail,
    otp,
    stage,
    trackingId: shipment.trackingId,
  });

  return {
    message: `${stage.toUpperCase()} OTP sent to ${recipientEmail}`,
    stage,
    recipientEmail,
    expiresAt,
    // Return OTP in development mode for seamless testing without SMTP
    ...(process.env.NODE_ENV === "development" ? { otp } : {}),
  };
}

export async function verifyShipmentOtp(
  id: string,
  stage: "pickup" | "delivery",
  otp: string,
  currentUser: SessionUser
) {
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  if (
    currentUser.role !== Role.STAFF &&
    currentUser.role !== Role.ADMIN &&
    (currentUser.role !== Role.DRIVER || shipment.assignedDriverId !== currentUser.id)
  ) {
    throw new ForbiddenError("Not authorized to verify OTP for this shipment");
  }

  if (!otp || typeof otp !== "string" || otp.length !== 6) {
    throw new AppError("A 6-digit OTP code is required", 400);
  }

  if (stage === "pickup") {
    if (shipment.status !== ShipmentStatus.CREATED) {
      throw new ConflictError(
        `Cannot verify pickup OTP: shipment must be in CREATED status (current: ${shipment.status})`
      );
    }

    if (!shipment.pickupOtpHash || !shipment.pickupOtpExpiresAt) {
      throw new AppError("No pickup OTP has been requested yet", 400);
    }

    if (new Date() > shipment.pickupOtpExpiresAt) {
      throw new AppError("Pickup OTP has expired. Please request a new one.", 400);
    }

    const isValid = verifyOtpHash(otp, shipment.pickupOtpHash);
    if (!isValid) {
      throw new AppError("Invalid pickup OTP code", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.PICKED_UP,
          pickupOtpHash: null,
          pickupOtpExpiresAt: null,
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedDriver: { select: { id: true, name: true, email: true } },
        },
      });

      const event = await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: ShipmentStatus.PICKED_UP,
          note: "Pickup verified successfully via sender OTP",
          createdByUserId: currentUser.id,
        },
      });

      return { updated, event };
    });

    emitShipmentChanged(result.updated, result.event);

    return result.updated;
  } else if (stage === "delivery") {
    if (shipment.status !== ShipmentStatus.OUT_FOR_DELIVERY) {
      throw new ConflictError(
        `Cannot verify delivery OTP: shipment must be in OUT_FOR_DELIVERY status (current: ${shipment.status})`
      );
    }

    if (!shipment.deliveryOtpHash || !shipment.deliveryOtpExpiresAt) {
      throw new AppError("No delivery OTP has been requested yet", 400);
    }

    if (new Date() > shipment.deliveryOtpExpiresAt) {
      throw new AppError("Delivery OTP has expired. Please request a new one.", 400);
    }

    const isValid = verifyOtpHash(otp, shipment.deliveryOtpHash);
    if (!isValid) {
      throw new AppError("Invalid delivery OTP code", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.DELIVERED,
          deliveryOtpHash: null,
          deliveryOtpExpiresAt: null,
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedDriver: { select: { id: true, name: true, email: true } },
        },
      });

      const event = await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: ShipmentStatus.DELIVERED,
          note: "Delivery verified successfully via receiver OTP",
          createdByUserId: currentUser.id,
        },
      });

      return { updated, event };
    });

    emitShipmentChanged(result.updated, result.event);

    return result.updated;
  } else {
    throw new AppError("Invalid stage. Must be 'pickup' or 'delivery'", 400);
  }
}
