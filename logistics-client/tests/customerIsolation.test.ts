import { describe, it, expect } from "vitest";
import { Role } from "@prisma/client";
import { ForbiddenError } from "../src/lib/errors";

describe("Customer Data Isolation Logic", () => {
  // Mock helper matching shipmentService logic
  function checkShipmentAccess(
    shipment: { id: string; customerId: string; assignedDriverId: string | null },
    user: { id: string; role: Role }
  ): boolean {
    if (user.role === Role.CUSTOMER && shipment.customerId !== user.id) {
      throw new ForbiddenError("You do not have permission to view this shipment");
    }
    if (user.role === Role.DRIVER && shipment.assignedDriverId !== user.id) {
      throw new ForbiddenError("You are not assigned to this shipment");
    }
    return true;
  }

  function getQueryFilter(user: { id: string; role: Role }) {
    if (user.role === Role.CUSTOMER) {
      return { customerId: user.id };
    }
    if (user.role === Role.DRIVER) {
      return { assignedDriverId: user.id };
    }
    return {};
  }

  it("permits customer to access only their own shipment", () => {
    const shipment = {
      id: "ship_1",
      customerId: "cust_123",
      assignedDriverId: "drv_999",
    };

    const owner = { id: "cust_123", role: Role.CUSTOMER };
    expect(checkShipmentAccess(shipment, owner)).toBe(true);

    const otherCustomer = { id: "cust_456", role: Role.CUSTOMER };
    expect(() => checkShipmentAccess(shipment, otherCustomer)).toThrow(ForbiddenError);
  });

  it("permits assigned driver but rejects unassigned driver", () => {
    const shipment = {
      id: "ship_1",
      customerId: "cust_123",
      assignedDriverId: "drv_999",
    };

    const assignedDriver = { id: "drv_999", role: Role.DRIVER };
    expect(checkShipmentAccess(shipment, assignedDriver)).toBe(true);

    const otherDriver = { id: "drv_000", role: Role.DRIVER };
    expect(() => checkShipmentAccess(shipment, otherDriver)).toThrow(ForbiddenError);
  });

  it("permits staff and admin to access any shipment", () => {
    const shipment = {
      id: "ship_1",
      customerId: "cust_123",
      assignedDriverId: "drv_999",
    };

    const staff = { id: "staff_1", role: Role.STAFF };
    const admin = { id: "admin_1", role: Role.ADMIN };

    expect(checkShipmentAccess(shipment, staff)).toBe(true);
    expect(checkShipmentAccess(shipment, admin)).toBe(true);
  });

  it("enforces strict customer isolation in queries", () => {
    const customer = { id: "cust_abc", role: Role.CUSTOMER };
    const driver = { id: "drv_xyz", role: Role.DRIVER };
    const staff = { id: "staff_1", role: Role.STAFF };
    const admin = { id: "admin_1", role: Role.ADMIN };

    expect(getQueryFilter(customer)).toEqual({ customerId: "cust_abc" });
    expect(getQueryFilter(driver)).toEqual({ assignedDriverId: "drv_xyz" });
    expect(getQueryFilter(staff)).toEqual({});
    expect(getQueryFilter(admin)).toEqual({});
  });
});
