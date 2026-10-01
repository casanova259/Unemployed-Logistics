import { NextRequest } from "next/server";
import { getPublicTracking } from "@/lib/services/trackingService";
import { handleApiError, apiSuccess } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const trackingData = await getPublicTracking(trackingId);
    return apiSuccess({ tracking: trackingData });
  } catch (error) {
    return handleApiError(error);
  }
}
