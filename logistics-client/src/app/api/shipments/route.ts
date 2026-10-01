import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createShipment, getShipments } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess, ForbiddenError } from "@/lib/errors";
import { ShipmentStatus, Role } from "@prisma/client";
import { z } from "zod";

const createShipmentSchema = z.object({
  customerId: z.string().optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Valid sender email is required"),
  senderAddress: z.string().min(1, "Sender address is required"),
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverEmail: z.string().email("Valid receiver email is required"),
  receiverPhone: z.string().min(5, "Receiver phone is required"),
  receiverAddress: z.string().min(1, "Receiver address is required"),
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  originHubId: z.string().nullish(),
  destHubId: z.string().nullish(),
  weightKg: z.number().positive("Weight must be greater than 0"),
  type: z.string().min(1, "Shipment type is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    // DRIVER cannot create shipments
    if (user.role === Role.DRIVER) {
      throw new ForbiddenError("Drivers are not permitted to create shipments");
    }

    const body = await req.json();
    const data = createShipmentSchema.parse(body);

    const shipment = await createShipment(data, user);
    return apiSuccess({ shipment, message: "Shipment created successfully" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status") as ShipmentStatus | null;
    const status = statusParam && Object.values(ShipmentStatus).includes(statusParam) ? statusParam : undefined;
    const q = searchParams.get("q") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await getShipments(user, { status, q, page, limit });
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
