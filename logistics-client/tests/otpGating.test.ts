import { describe, it, expect } from "vitest";
import { isOtpGatedTransition } from "../src/lib/stateMachine";
import {
  generate6DigitOtp,
  hashOtp,
  verifyOtpHash,
  getOtpExpiresAt,
} from "../src/lib/services/otpService";

describe("OTP Gating & Verification Tests", () => {
  it("identifies CREATED->PICKED_UP and OUT_FOR_DELIVERY->DELIVERED as OTP-gated", () => {
    // Only these two transitions require OTP
    expect(isOtpGatedTransition("CREATED", "PICKED_UP")).toBe(true);
    expect(isOtpGatedTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);

    // Other transitions do not require OTP
    expect(isOtpGatedTransition("PICKED_UP", "IN_TRANSIT")).toBe(false);
    expect(isOtpGatedTransition("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(false);
    expect(isOtpGatedTransition("OUT_FOR_DELIVERY", "FAILED")).toBe(false);
    expect(isOtpGatedTransition("FAILED", "RESCHEDULED")).toBe(false);
    expect(isOtpGatedTransition("FAILED", "RETURNED")).toBe(false);
    expect(isOtpGatedTransition("RESCHEDULED", "OUT_FOR_DELIVERY")).toBe(false);
  });

  it("generates a valid 6-digit numeric OTP", () => {
    for (let i = 0; i < 20; i++) {
      const otp = generate6DigitOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it("hashes OTP and verifies matching/mismatching codes correctly", () => {
    const otp = "849201";
    const hashed = hashOtp(otp);

    // Stored hash should never equal plain text
    expect(hashed).not.toBe(otp);
    expect(hashed).toHaveLength(64); // SHA-256 hex length

    // Correct verification
    expect(verifyOtpHash(otp, hashed)).toBe(true);

    // Incorrect code verification
    expect(verifyOtpHash("123456", hashed)).toBe(false);
    expect(verifyOtpHash("849202", hashed)).toBe(false);
  });

  it("sets OTP expiration time to 10 minutes in the future", () => {
    const before = Date.now();
    const expiresAt = getOtpExpiresAt();
    const after = Date.now();

    const diffMinutes = (expiresAt.getTime() - before) / (1000 * 60);
    expect(diffMinutes).toBeGreaterThanOrEqual(9.99);
    expect(diffMinutes).toBeLessThanOrEqual(10.01);
  });
});
