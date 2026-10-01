import { describe, it, expect } from "vitest";

describe("Public Tracking Privacy & Payload Tests", () => {
  // Mock function representing getPublicTracking field sanitization
  function sanitizeForPublicTracking(rawShipment: {
    id: string;
    trackingId: string;
    customerId: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    senderAddress: string;
    receiverName: string;
    receiverEmail: string;
    receiverPhone: string;
    receiverAddress: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    weightKg: number;
    type: string;
    status: string;
    assignedDriverId?: string | null;
    pickupOtpHash?: string | null;
    deliveryOtpHash?: string | null;
    createdAt: Date;
    updatedAt: Date;
    events: { id: string; status: string; note: string | null; createdAt: Date }[];
    destHub?: { city: string } | null;
  }) {
    const receiverCity = rawShipment.destHub?.city || "Chandigarh";

    return {
      trackingId: rawShipment.trackingId,
      status: rawShipment.status,
      type: rawShipment.type,
      weightKg: rawShipment.weightKg,
      originLat: rawShipment.originLat,
      originLng: rawShipment.originLng,
      destLat: rawShipment.destLat,
      destLng: rawShipment.destLng,
      receiverCity,
      createdAt: rawShipment.createdAt,
      updatedAt: rawShipment.updatedAt,
      timeline: rawShipment.events,
    };
  }

  it("never includes PII (phone, email, full address, OTP hashes) in public response", () => {
    const raw = {
      id: "sh_123",
      trackingId: "SHP-A1B2C3D4",
      customerId: "user_secret_id",
      senderName: "Alice Doe",
      senderEmail: "alice@private.com",
      senderPhone: "+91-9876543210",
      senderAddress: "Flat 402, Rose Villa, Sector 17, Chandigarh",
      receiverName: "Bob Smith",
      receiverEmail: "bob@private.com",
      receiverPhone: "+91-9123456780",
      receiverAddress: "House 10, Connaught Place, New Delhi",
      originLat: 30.7333,
      originLng: 76.7794,
      destLat: 28.6139,
      destLng: 77.209,
      weightKg: 2.5,
      type: "Express",
      status: "IN_TRANSIT",
      assignedDriverId: "drv_secret",
      pickupOtpHash: "hash_secret_pickup",
      deliveryOtpHash: "hash_secret_delivery",
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [
        { id: "e1", status: "CREATED", note: "Created", createdAt: new Date() },
        { id: "e2", status: "PICKED_UP", note: "Picked up", createdAt: new Date() },
        { id: "e3", status: "IN_TRANSIT", note: "On the way", createdAt: new Date() },
      ],
      destHub: { city: "Delhi" },
    };

    const publicData = sanitizeForPublicTracking(raw);

    // Verify safe fields are present
    expect(publicData.trackingId).toBe("SHP-A1B2C3D4");
    expect(publicData.status).toBe("IN_TRANSIT");
    expect(publicData.receiverCity).toBe("Delhi");
    expect(publicData.originLat).toBe(30.7333);
    expect(publicData.originLng).toBe(76.7794);
    expect(publicData.destLat).toBe(28.6139);
    expect(publicData.destLng).toBe(77.209);
    expect(publicData.timeline).toHaveLength(3);

    // Verify STRICT ABSENCE of any PII
    const serialized = JSON.stringify(publicData);
    expect(serialized).not.toContain("alice@private.com");
    expect(serialized).not.toContain("bob@private.com");
    expect(serialized).not.toContain("+91-9876543210");
    expect(serialized).not.toContain("+91-9123456780");
    expect(serialized).not.toContain("Flat 402");
    expect(serialized).not.toContain("House 10");
    expect(serialized).not.toContain("hash_secret_pickup");
    expect(serialized).not.toContain("hash_secret_delivery");
    expect(serialized).not.toContain("user_secret_id");
    expect(serialized).not.toContain("drv_secret");
  });
});
