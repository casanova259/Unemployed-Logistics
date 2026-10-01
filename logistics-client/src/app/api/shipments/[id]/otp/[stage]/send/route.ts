import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { sendShipmentOtp } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess, AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const user = await requireUser();
    const { id, stage } = await params;

    if (stage !== "pickup" && stage !== "delivery") {
      throw new AppError("Invalid OTP stage. Must be 'pickup' or 'delivery'", 400);
    }

    const result = await sendShipmentOtp(id, stage, user);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
