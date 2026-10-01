import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess, ForbiddenError } from "@/lib/errors";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== Role.STAFF && user.role !== Role.ADMIN) {
      throw new ForbiddenError("Access restricted to staff and admins");
    }

    const drivers = await prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isOnline: true,
        vehicles: {
          select: { id: true, plate: true, type: true },
        },
        _count: {
          select: {
            driverShipments: {
              where: {
                status: {
                  notIn: ["DELIVERED", "RETURNED"],
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({ drivers });
  } catch (error) {
    return handleApiError(error);
  }
}
