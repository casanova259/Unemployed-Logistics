import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess, ForbiddenError } from "@/lib/errors";
import { Role, VehicleType } from "@prisma/client";
import { z } from "zod";

const createVehicleSchema = z.object({
  plate: z.string().min(3, "Plate is required"),
  type: z.nativeEnum(VehicleType),
  driverId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== Role.STAFF && user.role !== Role.ADMIN) {
      throw new ForbiddenError("Access restricted to staff and admins");
    }

    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { plate: "asc" },
    });

    return apiSuccess({ vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenError("Only administrators can create vehicles");
    }

    const body = await req.json();
    const data = createVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: data.plate.trim().toUpperCase(),
        type: data.type,
        driverId: data.driverId || null,
        isActive: data.isActive ?? true,
      },
    });

    return apiSuccess({ vehicle, message: "Vehicle registered successfully" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
