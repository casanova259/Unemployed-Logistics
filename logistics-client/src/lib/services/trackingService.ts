import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  predictShipmentEtaAndDelay,
  EtaPredictionResult,
} from "./etaPredictionService";

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
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number; city: string };
  eta?: EtaPredictionResult;
  createdAt: Date;
  updatedAt: Date;
  timeline: {
    id: string;
    status: string;
    note: string | null;
    lat?: number | null;
    lng?: number | null;
    createdAt: Date;
  }[];
  events: {
    id: string;
    status: string;
    note: string | null;
    lat?: number | null;
    lng?: number | null;
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
  const normalizedId = trackingId.trim().toUpperCase();
  const alternateId = normalizedId.startsWith("SHP-100000")
    ? normalizedId.replace("SHP-100000", "SHP-100100")
    : normalizedId.startsWith("SHP-100100")
    ? normalizedId.replace("SHP-100100", "SHP-100000")
    : normalizedId;

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [{ trackingId: normalizedId }, { trackingId: alternateId }],
    },
    include: {
      destHub: true,
      events: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          note: true,
          lat: true,
          lng: true,
          createdAt: true,
        },
      },
    },
  });

  if (!shipment) {
    throw new NotFoundError(`No shipment found with tracking ID "${trackingId}"`);
  }

  const receiverCity = extractCity(shipment.receiverAddress, shipment.destHub?.city);

  const lastEvent = shipment.events[shipment.events.length - 1];
  const etaPrediction = predictShipmentEtaAndDelay({
    originLat: shipment.originLat,
    originLng: shipment.originLng,
    destLat: shipment.destLat,
    destLng: shipment.destLng,
    weightKg: shipment.weightKg,
    type: shipment.type,
    status: shipment.status,
    createdAt: shipment.createdAt,
    lastEventTime: lastEvent?.createdAt,
    lastEventLat: lastEvent?.lat,
    lastEventLng: lastEvent?.lng,
  });

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
    origin: { lat: shipment.originLat, lng: shipment.originLng },
    destination: {
      lat: shipment.destLat,
      lng: shipment.destLng,
      city: receiverCity,
    },
    eta: etaPrediction,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    timeline: shipment.events,
    events: shipment.events,
  };
}
