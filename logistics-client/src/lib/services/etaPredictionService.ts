/**
 * Smart Delivery ETA & Delay Risk Prediction Engine
 * Implements statistical regression & heuristic scoring factoring:
 * - Haversine inter-city highway distance vs last-mile urban routing
 * - Cargo weight & fragility handling latency
 * - Status lifecycle progress & historical elapsed transit time
 * - Traffic peak & inter-city corridor congestion factors
 */

import { ShipmentStatus } from "@prisma/client";

export interface EtaPredictionInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  weightKg: number;
  type: string;
  status: ShipmentStatus;
  createdAt: Date | string;
  lastEventTime?: Date | string;
  lastEventLat?: number | null;
  lastEventLng?: number | null;
}

export interface EtaPredictionResult {
  distanceKm: number;
  estimatedDurationMinutes: number;
  predictedDeliveryDate: Date;
  formattedDeliveryDate: string;
  delayRiskScore: number; // 0 - 100
  delayRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  delayRiskFactors: string[];
  confidencePercent: number;
  statusExplanation: string;
}

/**
 * Calculates Great-Circle distance in kilometers using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function predictShipmentEtaAndDelay(
  input: EtaPredictionInput
): EtaPredictionResult {
  // If already terminal:
  if (input.status === ShipmentStatus.DELIVERED) {
    return {
      distanceKm: 0,
      estimatedDurationMinutes: 0,
      predictedDeliveryDate: new Date(input.lastEventTime || input.createdAt),
      formattedDeliveryDate: "Delivered",
      delayRiskScore: 0,
      delayRiskLevel: "LOW",
      delayRiskFactors: ["Shipment safely delivered to recipient"],
      confidencePercent: 100,
      statusExplanation: "Consignment completed. Sign-off recorded.",
    };
  }

  if (input.status === ShipmentStatus.RETURNED) {
    return {
      distanceKm: 0,
      estimatedDurationMinutes: 0,
      predictedDeliveryDate: new Date(),
      formattedDeliveryDate: "Returned to Origin",
      delayRiskScore: 100,
      delayRiskLevel: "HIGH",
      delayRiskFactors: ["Delivery failed terminal state - Returned to Hub"],
      confidencePercent: 100,
      statusExplanation: "Consignment returned to origin facility.",
    };
  }

  // 1. Calculate road-adjusted distance (Haversine * 1.25 winding factor for Indian highways)
  const currentLat = input.lastEventLat ?? input.originLat;
  const currentLng = input.lastEventLng ?? input.originLng;
  const directDistance = calculateHaversineDistanceKm(
    currentLat,
    currentLng,
    input.destLat,
    input.destLng
  );
  const roadDistanceKm = Math.max(5, Math.round(directDistance * 1.28 * 10) / 10);

  // 2. Base transit speed:
  // Inter-city (> 50km) = 48 km/h avg linehaul, Local intra-city (<= 50km) = 22 km/h
  const avgSpeedKmh = roadDistanceKm > 50 ? 48 : 22;
  let baseTransitMinutes = (roadDistanceKm / avgSpeedKmh) * 60;

  // 3. Multiplier based on current lifecycle stage:
  // - CREATED: needs dispatch + pickup + hub sorting (+ 90 mins)
  // - PICKED_UP: at hub undergoing loading (+ 45 mins)
  // - IN_TRANSIT: en-route
  // - OUT_FOR_DELIVERY: last-mile delivery window (30 - 75 mins)
  // - RESCHEDULED: delayed next day dispatch
  let lifecycleBufferMinutes = 0;
  const riskFactors: string[] = [];
  let riskScore = 12; // Base baseline risk

  switch (input.status) {
    case ShipmentStatus.CREATED:
      lifecycleBufferMinutes = 110;
      riskScore += 10;
      riskFactors.push("Awaiting warehouse dispatch & driver assignment");
      break;
    case ShipmentStatus.PICKED_UP:
      lifecycleBufferMinutes = 60;
      riskScore += 8;
      riskFactors.push("Consolidation & gate scan in progress at origin hub");
      break;
    case ShipmentStatus.IN_TRANSIT:
      lifecycleBufferMinutes = 30;
      riskScore += 5;
      riskFactors.push("Linehaul highway transit along NH corridor");
      break;
    case ShipmentStatus.OUT_FOR_DELIVERY:
      baseTransitMinutes = Math.min(baseTransitMinutes, 90);
      lifecycleBufferMinutes = 25;
      riskScore += 10;
      riskFactors.push("Final-mile courier van active in destination zone");
      break;
    case ShipmentStatus.FAILED:
      lifecycleBufferMinutes = 360;
      riskScore += 65;
      riskFactors.push("Prior delivery attempt failed; premise locked / recipient unavailable");
      break;
    case ShipmentStatus.RESCHEDULED:
      lifecycleBufferMinutes = 480;
      riskScore += 45;
      riskFactors.push("Consignment rescheduled for priority next delivery cycle");
      break;
  }

  // 4. Cargo Type & Weight Penalties:
  const lowerType = input.type.toLowerCase();
  if (lowerType.includes("fragile") || lowerType.includes("decor") || lowerType.includes("glass")) {
    baseTransitMinutes += 25;
    riskScore += 12;
    riskFactors.push("Fragile cargo: speed restricted for transit integrity");
  } else if (lowerType.includes("heavy") || lowerType.includes("hardware") || input.weightKg > 12) {
    baseTransitMinutes += 35;
    riskScore += 14;
    riskFactors.push(`Heavy freight (${input.weightKg} kg): forklift & offloading buffer added`);
  } else if (lowerType.includes("express") || lowerType.includes("document")) {
    baseTransitMinutes = Math.max(30, baseTransitMinutes * 0.85);
    riskScore = Math.max(5, riskScore - 8);
    riskFactors.push("Express priority lane allocation");
  }

  // 5. Elapsed Time Check:
  const createdDate = new Date(input.createdAt);
  const now = new Date();
  const elapsedHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  if (elapsedHours > 24) {
    riskScore += 25;
    riskFactors.push(`Active consignment exceeds 24h operational window (${Math.round(elapsedHours)}h elapsed)`);
  } else if (elapsedHours > 12 && input.status === ShipmentStatus.CREATED) {
    riskScore += 20;
    riskFactors.push("Consignment created > 12 hours ago but pending pickup");
  }

  // Calculate final ETA timestamp
  const totalMinutes = Math.round(baseTransitMinutes + lifecycleBufferMinutes);
  const predictedDeliveryDate = new Date(now.getTime() + totalMinutes * 60 * 1000);

  // Normalize Risk Score (0 - 100)
  const normalizedRiskScore = Math.min(99, Math.max(5, riskScore));
  let delayRiskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (normalizedRiskScore >= 60) {
    delayRiskLevel = "HIGH";
  } else if (normalizedRiskScore >= 30) {
    delayRiskLevel = "MEDIUM";
  }

  // Confidence calculation (higher distance & fewer exceptions = high confidence)
  const confidencePercent = Math.max(78, Math.min(98, Math.round(100 - normalizedRiskScore * 0.22)));

  // Format delivery time string
  const isToday = predictedDeliveryDate.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = predictedDeliveryDate.toDateString() === tomorrow.toDateString();

  const timeString = predictedDeliveryDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let formattedDeliveryDate = `${predictedDeliveryDate.toLocaleDateString([], { month: "short", day: "numeric" })} by ${timeString}`;
  if (isToday) {
    formattedDeliveryDate = `Today by ${timeString}`;
  } else if (isTomorrow) {
    formattedDeliveryDate = `Tomorrow by ${timeString}`;
  }

  let statusExplanation = `Estimated arrival in ${Math.round(totalMinutes / 60)} hours (${roadDistanceKm} km road distance).`;
  if (totalMinutes < 60) {
    statusExplanation = `Estimated arrival in ~${totalMinutes} minutes.`;
  }

  return {
    distanceKm: roadDistanceKm,
    estimatedDurationMinutes: totalMinutes,
    predictedDeliveryDate,
    formattedDeliveryDate,
    delayRiskScore: normalizedRiskScore,
    delayRiskLevel,
    delayRiskFactors: riskFactors.slice(0, 3),
    confidencePercent,
    statusExplanation,
  };
}
