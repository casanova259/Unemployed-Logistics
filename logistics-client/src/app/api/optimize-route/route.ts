import { NextRequest } from "next/server";
import { optimizeMultiStopRoute, Waypoint } from "@/lib/services/routeOptimizer";
import { apiSuccess, handleApiError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.origin || !body.destination) {
      throw new ValidationError("Both origin and destination waypoints are required");
    }

    const origin: Waypoint = body.origin;
    const stops: Waypoint[] = Array.isArray(body.stops) ? body.stops : [];
    const destination: Waypoint = body.destination;

    const result = await optimizeMultiStopRoute(origin, stops, destination);

    return apiSuccess({
      result,
      message: `Route optimized successfully. Saved ${result.efficiencySavingsPercent}% distance.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
