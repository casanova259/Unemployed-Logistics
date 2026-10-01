import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { verifyShipmentOtp } from "@/lib/services/shipmentService";
import { handleApiError, apiSuccess, AppError } from "@/lib/errors";
import { z } from "zod";

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

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

    const body = await req.json();
    const data = verifyOtpSchema.parse(body);

    const updated = await verifyShipmentOtp(id, stage, data.otp, user);
    return apiSuccess({
      shipment: updated,
      message: `${stage.toUpperCase()} OTP verified successfully. Status transitioned to ${updated.status}.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
