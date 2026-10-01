import { describe, it, expect } from "vitest";
import {
  predictShipmentEtaAndDelay,
  calculateHaversineDistanceKm,
} from "../src/lib/services/etaPredictionService";
import {
  solveTsp2Opt,
  haversineKm,
  Waypoint,
} from "../src/lib/services/routeOptimizer";

describe("Smart Delivery ETA & Delay Risk Prediction Engine", () => {
  it("predicts immediate zero-delay for already DELIVERED shipments", () => {
    const eta = predictShipmentEtaAndDelay({
      status: "DELIVERED",
      originLat: 28.6139,
      originLng: 77.209,
      destLat: 28.5355,
      destLng: 77.391,
      weightKg: 5,
      type: "Standard",
      createdAt: new Date(),
    });

    expect(eta.estimatedDurationMinutes).toBe(0);
    expect(eta.delayRiskLevel).toBe("LOW");
    expect(eta.delayRiskScore).toBe(0);
    expect(eta.formattedDeliveryDate).toBe("Delivered");
  });

  it("assigns HIGH delay risk to FAILED delivery attempts", () => {
    const eta = predictShipmentEtaAndDelay({
      status: "FAILED",
      originLat: 28.6139,
      originLng: 77.209,
      destLat: 19.076,
      destLng: 72.8777,
      weightKg: 25,
      type: "Fragile",
      createdAt: new Date(),
    });

    expect(eta.delayRiskLevel).toBe("HIGH");
    expect(eta.delayRiskScore).toBeGreaterThanOrEqual(70);
    expect(eta.delayRiskFactors).toEqual(
      expect.arrayContaining([expect.stringContaining("delivery attempt failed")])
    );
  });

  it("calculates road-adjusted distance and estimated duration for IN_TRANSIT cargo", () => {
    const eta = predictShipmentEtaAndDelay({
      status: "IN_TRANSIT",
      originLat: 28.6139,
      originLng: 77.209,
      destLat: 28.7041,
      destLng: 77.1025,
      weightKg: 10,
      type: "Standard",
      createdAt: new Date(),
    });

    expect(eta.distanceKm).toBeGreaterThan(0);
    expect(eta.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(eta.predictedDeliveryDate.getTime()).toBeGreaterThan(Date.now() - 1000);
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(eta.delayRiskLevel);
  });
});

describe("Logistics Route Optimizer (2-Opt TSP & Haversine)", () => {
  it("computes accurate Haversine distance between coordinates", () => {
    // Distance between Delhi (28.6139, 77.2090) and Mumbai (19.0760, 72.8777) is ~1148 km
    const dist = haversineKm(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });

  it("preserves single stop between origin and destination", () => {
    const origin: Waypoint = { id: "origin", lat: 28.6139, lng: 77.209, name: "Delhi Central Hub", city: "Delhi" };
    const stop: Waypoint = { id: "stop-1", lat: 28.5355, lng: 77.391, name: "Noida Sector 62", city: "Noida" };
    const dest: Waypoint = { id: "dest", lat: 28.4595, lng: 77.0266, name: "Gurgaon Cyber City", city: "Gurgaon" };

    const optimized = solveTsp2Opt(origin, [stop], dest);
    expect(optimized).toHaveLength(3);
    expect(optimized[0].id).toBe("origin");
    expect(optimized[1].id).toBe("stop-1");
    expect(optimized[2].id).toBe("dest");
  });

  it("sequences multiple intermediate stops with fixed start and end using 2-Opt", () => {
    const origin: Waypoint = { id: "origin", lat: 0, lng: 0, name: "Start", city: "A" };
    const stopC: Waypoint = { id: "stop-c", lat: 3, lng: 0, name: "Far Stop", city: "C" };
    const stopA: Waypoint = { id: "stop-a", lat: 1, lng: 0, name: "Near Stop", city: "B" };
    const stopB: Waypoint = { id: "stop-b", lat: 2, lng: 0, name: "Mid Stop", city: "D" };
    const dest: Waypoint = { id: "dest", lat: 4, lng: 0, name: "Finish", city: "E" };

    const optimized = solveTsp2Opt(origin, [stopC, stopA, stopB], dest);
    expect(optimized).toHaveLength(5);
    expect(optimized[0].id).toBe("origin");
    expect(optimized[4].id).toBe("dest");

    // Order should be sequentially ordered: origin -> stop-a -> stop-b -> stop-c -> dest
    expect(optimized.map((w) => w.id)).toEqual(["origin", "stop-a", "stop-b", "stop-c", "dest"]);
  });
});
