import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess, ForbiddenError } from "@/lib/errors";
import { Role } from "@prisma/client";
import { z } from "zod";

const createHubSchema = z.object({
  name: z.string().min(1, "Hub name is required"),
  city: z.string().min(1, "City is required"),
  lat: z.number(),
  lng: z.number(),
});

export async function GET() {
  try {
    const hubs = await prisma.hub.findMany({
      orderBy: { name: "asc" },
    });
    return apiSuccess({ hubs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenError("Only administrators can create hubs");
    }

    const body = await req.json();
    const data = createHubSchema.parse(body);

    const hub = await prisma.hub.create({
      data: {
        name: data.name.trim(),
        city: data.city.trim(),
        lat: data.lat,
        lng: data.lng,
      },
    });

    return apiSuccess({ hub, message: "Hub created successfully" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
