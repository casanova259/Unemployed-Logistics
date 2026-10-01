import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getShipmentById } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const shipment = await getShipmentById(id, user);
    return apiSuccess({ shipment });
  } catch (error) {
    return handleApiError(error);
  }
}
