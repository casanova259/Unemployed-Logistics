import { ShipmentStatus } from "@prisma/client";

/**
 * Allowed status transitions mapped from current status to allowed next statuses
 */
export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  FAILED: ["RESCHEDULED", "RETURNED"],
  RESCHEDULED: ["OUT_FOR_DELIVERY"],
  DELIVERED: [], // Terminal
  RETURNED: [],  // Terminal
};

/**
 * Pure function: returns true if the transition from `from` to `to` is valid according to the state machine
 */
export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Checks whether a transition requires OTP verification
 */
export function isOtpGatedTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === "CREATED" && to === "PICKED_UP") return true;
  if (from === "OUT_FOR_DELIVERY" && to === "DELIVERED") return true;
  return false;
}

/**
 * Returns allowed next statuses for UI buttons
 */
export function getNextAllowedStatuses(current: ShipmentStatus): ShipmentStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}

/**
 * Checks if status is terminal
 */
export function isTerminalStatus(status: ShipmentStatus): boolean {
  return status === "DELIVERED" || status === "RETURNED";
}
