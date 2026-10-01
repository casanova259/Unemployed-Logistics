import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { updateShipmentStatusGeneric } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess } from "@/lib/errors";
import { ShipmentStatus } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  note: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const data = updateStatusSchema.parse(body);

    const updated = await updateShipmentStatusGeneric(id, data, user);
    return apiSuccess({ shipment: updated, message: `Status updated to ${data.status}` });
  } catch (error) {
    return handleApiError(error);
  }
}
