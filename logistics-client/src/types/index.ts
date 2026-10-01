import { Role, ShipmentStatus, VehicleType } from "@prisma/client";

export type { Role, ShipmentStatus, VehicleType };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  isOnline?: boolean;
}

export interface HubData {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export interface VehicleData {
  id: string;
  plate: string;
  type: VehicleType;
  driverId?: string | null;
  isActive: boolean;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}

export interface ShipmentEventData {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  note?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string | Date;
  createdByUser?: {
    id: string;
    name: string;
    role: Role;
  } | null;
}

export interface ShipmentData {
  id: string;
  trackingId: string;
  customerId: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originHubId?: string | null;
  destHubId?: string | null;
  weightKg: number;
  type: string;
  status: ShipmentStatus;
  assignedDriverId?: string | null;
  vehicleId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  assignedDriver?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isOnline?: boolean;
  } | null;
  vehicle?: VehicleData | null;
  originHub?: HubData | null;
  destHub?: HubData | null;
  events?: ShipmentEventData[];
}
