import { Shipment, ShipmentEvent } from "@prisma/client";

/**
 * Emits shipment changed event to the socket realtime server.
 * Fire-and-forget: catch and log, never throws or fails main request.
 */
export async function emitShipmentChanged(
  shipment: Partial<Shipment> & { id: string; trackingId?: string; status: string; customerId?: string; assignedDriverId?: string | null },
  event: Partial<ShipmentEvent> & { id: string; status: string; note?: string | null; createdAt: Date }
): Promise<void> {
  const socketServerUrl = process.env.SOCKET_SERVER_URL || "http://localhost:8000";
  const emitSecret = process.env.SOCKET_EMIT_SECRET || "logistics-secret-socket-emit-token-2026";

  const payload = {
    event: "shipment:changed",
    data: {
      shipment: {
        id: shipment.id,
        trackingId: shipment.trackingId,
        status: shipment.status,
        customerId: shipment.customerId,
        assignedDriverId: shipment.assignedDriverId,
      },
      event: {
        id: event.id,
        status: event.status,
        note: event.note,
        createdAt: event.createdAt,
      },
    },
    // Optional room target or broadcast
    room: `shipment:${shipment.id}`,
    recipientUserId: shipment.assignedDriverId || shipment.customerId,
  };

  try {
    const res = await fetch(`${socketServerUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-emit-secret": emitSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[Socket Emit] Server responded with status ${res.status}`);
    }
  } catch (error) {
    // Non-blocking log
    console.warn("[Socket Emit] Failed to notify socket server (service may be offline):", (error as Error).message);
  }
}
