import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { assignDriverAndVehicle } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess } from "@/lib/errors";
import { z } from "zod";

const assignSchema = z.object({
  driverId: z.string().min(1, "driverId is required"),
  vehicleId: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const data = assignSchema.parse(body);

    const updated = await assignDriverAndVehicle(id, data, user);
    return apiSuccess({ shipment: updated, message: "Driver and vehicle assigned successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
