import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextAllowedStatuses,
  isTerminalStatus,
  ALLOWED_TRANSITIONS,
} from "../src/lib/stateMachine";
import { ShipmentStatus } from "@prisma/client";

describe("Lifecycle State Machine (Pure Unit Tests)", () => {
  it("allows all valid forward transitions according to requirements", () => {
    expect(canTransition("CREATED", "PICKED_UP")).toBe(true);
    expect(canTransition("PICKED_UP", "IN_TRANSIT")).toBe(true);
    expect(canTransition("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "FAILED")).toBe(true);
    expect(canTransition("FAILED", "RESCHEDULED")).toBe(true);
    expect(canTransition("FAILED", "RETURNED")).toBe(true);
    expect(canTransition("RESCHEDULED", "OUT_FOR_DELIVERY")).toBe(true);
  });

  it("rejects invalid status skips and backwards jumps", () => {
    // Skipping stages
    expect(canTransition("CREATED", "IN_TRANSIT")).toBe(false);
    expect(canTransition("CREATED", "OUT_FOR_DELIVERY")).toBe(false);
    expect(canTransition("CREATED", "DELIVERED")).toBe(false);
    expect(canTransition("PICKED_UP", "DELIVERED")).toBe(false);
    expect(canTransition("IN_TRANSIT", "DELIVERED")).toBe(false);

    // Invalid backward jumps
    expect(canTransition("IN_TRANSIT", "PICKED_UP")).toBe(false);
    expect(canTransition("OUT_FOR_DELIVERY", "CREATED")).toBe(false);
    expect(canTransition("FAILED", "CREATED")).toBe(false);
    expect(canTransition("FAILED", "IN_TRANSIT")).toBe(false);
  });

  it("enforces DELIVERED and RETURNED as strictly terminal", () => {
    const statuses: ShipmentStatus[] = [
      "CREATED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "FAILED",
      "RESCHEDULED",
      "RETURNED",
    ];

    expect(isTerminalStatus("DELIVERED")).toBe(true);
    expect(isTerminalStatus("RETURNED")).toBe(true);
    expect(getNextAllowedStatuses("DELIVERED")).toEqual([]);
    expect(getNextAllowedStatuses("RETURNED")).toEqual([]);

    for (const target of statuses) {
      expect(canTransition("DELIVERED", target)).toBe(false);
      expect(canTransition("RETURNED", target)).toBe(false);
    }
  });

  it("returns exactly expected next allowed statuses for each state", () => {
    expect(getNextAllowedStatuses("CREATED")).toEqual(["PICKED_UP"]);
    expect(getNextAllowedStatuses("PICKED_UP")).toEqual(["IN_TRANSIT"]);
    expect(getNextAllowedStatuses("IN_TRANSIT")).toEqual(["OUT_FOR_DELIVERY"]);
    expect(getNextAllowedStatuses("OUT_FOR_DELIVERY")).toEqual(["DELIVERED", "FAILED"]);
    expect(getNextAllowedStatuses("FAILED")).toEqual(["RESCHEDULED", "RETURNED"]);
    expect(getNextAllowedStatuses("RESCHEDULED")).toEqual(["OUT_FOR_DELIVERY"]);
  });
});
