import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export interface PublicTrackingResponse {
  trackingId: string;
  status: string;
  type: string;
  weightKg: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  receiverCity: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: {
    id: string;
    status: string;
    note: string | null;
    createdAt: Date;
  }[];
}

/**
 * Extracts city from address string or hub city safely
 */
function extractCity(address: string, hubCity?: string | null): string {
  if (hubCity) return hubCity;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Usually City, State or City, Country
    return parts[parts.length - 2];
  }
  return parts[0] || "Unknown City";
}

export async function getPublicTracking(trackingId: string): Promise<PublicTrackingResponse> {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingId },
    include: {
      destHub: true,
      events: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!shipment) {
    throw new NotFoundError(`No shipment found with tracking ID "${trackingId}"`);
  }

  const receiverCity = extractCity(shipment.receiverAddress, shipment.destHub?.city);

  return {
    trackingId: shipment.trackingId,
    status: shipment.status,
    type: shipment.type,
    weightKg: shipment.weightKg,
    originLat: shipment.originLat,
    originLng: shipment.originLng,
    destLat: shipment.destLat,
    destLng: shipment.destLng,
    receiverCity,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    timeline: shipment.events,
  };
}
