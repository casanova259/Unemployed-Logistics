import { PrismaClient, Role, VehicleType, ShipmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing records in correct relation order
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.hub.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);
  const driverPasswordHash = await bcrypt.hash("driver123", 10);
  const customerPasswordHash = await bcrypt.hash("customer123", 10);

  // 3. Seed Users
  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      name: "Admin Superuser",
      email: "admin@logistics.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      phone: "+91-9800000001",
      isOnline: true,
    },
  });

  // 2 Staff (Dispatchers)
  const staff1 = await prisma.user.create({
    data: {
      name: "Rohan Verma (Dispatcher)",
      email: "staff1@logistics.com",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      phone: "+91-9800000002",
      isOnline: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: "Pooja Sharma (Ops)",
      email: "staff2@logistics.com",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      phone: "+91-9800000003",
      isOnline: true,
    },
  });

  // 2 Drivers
  const driver1 = await prisma.user.create({
    data: {
      name: "Gurpreet Singh",
      email: "driver1@logistics.com",
      passwordHash: driverPasswordHash,
      role: Role.DRIVER,
      phone: "+91-9800000004",
      isOnline: true,
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      name: "Amit Patel",
      email: "driver2@logistics.com",
      passwordHash: driverPasswordHash,
      role: Role.DRIVER,
      phone: "+91-9800000005",
      isOnline: true,
    },
  });

  // 2 Customers
  const customer1 = await prisma.user.create({
    data: {
      name: "Neha Gupta",
      email: "customer1@logistics.com",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      phone: "+91-9800000006",
      isOnline: false,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Vikram Malhotra",
      email: "customer2@logistics.com",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      phone: "+91-9800000007",
      isOnline: false,
    },
  });

  console.log("✓ Seeded 1 admin, 2 staff, 2 drivers, 2 customers");

  // 4. Seed 4 Hubs (Chandigarh, Delhi, Ludhiana, Amritsar)
  const hubChandigarh = await prisma.hub.create({
    data: {
      name: "Chandigarh Hub",
      city: "Chandigarh",
      lat: 30.7333,
      lng: 76.7794,
    },
  });

  const hubDelhi = await prisma.hub.create({
    data: {
      name: "Delhi Logistics Hub",
      city: "Delhi",
      lat: 28.6139,
      lng: 77.209,
    },
  });

  const hubLudhiana = await prisma.hub.create({
    data: {
      name: "Ludhiana Cargo Hub",
      city: "Ludhiana",
      lat: 30.901,
      lng: 75.8573,
    },
  });

  const hubAmritsar = await prisma.hub.create({
    data: {
      name: "Amritsar Express Hub",
      city: "Amritsar",
      lat: 31.634,
      lng: 74.8723,
    },
  });

  console.log("✓ Seeded 4 regional hubs");

  // 5. Seed 3 Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plate: "CH-01-AB-1234",
      type: VehicleType.VAN,
      driverId: driver1.id,
      isActive: true,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plate: "DL-01-XY-5678",
      type: VehicleType.TRUCK,
      driverId: driver2.id,
      isActive: true,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      plate: "PB-02-EV-9999",
      type: VehicleType.EV,
      driverId: null,
      isActive: true,
    },
  });

  console.log("✓ Seeded 3 vehicles");

  // 6. Helper for timestamps
  const now = Date.now();
  const minutesAgo = (mins: number) => new Date(now - mins * 60 * 1000);

  // 7. Seed 10 Shipments across ALL statuses
  // 1: CREATED
  const s1 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010001",
      customerId: customer1.id,
      senderName: "TechCorp Labs",
      senderEmail: "dispatch@techcorp.io",
      senderAddress: "Sector 17 Market, Chandigarh",
      receiverName: "Karan Mehta",
      receiverEmail: "karan@gmail.com",
      receiverPhone: "+91-9876501111",
      receiverAddress: "Connaught Place, Central Delhi",
      originLat: hubChandigarh.lat,
      originLng: hubChandigarh.lng,
      destLat: hubDelhi.lat,
      destLng: hubDelhi.lng,
      originHubId: hubChandigarh.id,
      destHubId: hubDelhi.id,
      weightKg: 4.5,
      type: "Express Electronics",
      status: ShipmentStatus.CREATED,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(120),
    },
  });
  await prisma.shipmentEvent.create({
    data: {
      shipmentId: s1.id,
      status: ShipmentStatus.CREATED,
      note: "Shipment booked and waiting for pickup",
      lat: hubChandigarh.lat,
      lng: hubChandigarh.lng,
      createdByUserId: staff1.id,
      createdAt: minutesAgo(120),
    },
  });

  // 2: PICKED_UP
  const s2 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010002",
      customerId: customer1.id,
      senderName: "Punjab Textiles Ltd",
      senderEmail: "sales@punjabtextiles.in",
      senderAddress: "Industrial Area B, Ludhiana",
      receiverName: "Aarav Gupta",
      receiverEmail: "aarav@gmail.com",
      receiverPhone: "+91-9876502222",
      receiverAddress: "Sector 35-B, Chandigarh",
      originLat: hubLudhiana.lat,
      originLng: hubLudhiana.lng,
      destLat: hubChandigarh.lat,
      destLng: hubChandigarh.lng,
      originHubId: hubLudhiana.id,
      destHubId: hubChandigarh.id,
      weightKg: 12.0,
      type: "Garment Consignment",
      status: ShipmentStatus.PICKED_UP,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(180),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s2.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment created",
        createdByUserId: customer1.id,
        createdAt: minutesAgo(180),
      },
      {
        shipmentId: s2.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Driver verified pickup OTP and loaded package",
        lat: hubLudhiana.lat,
        lng: hubLudhiana.lng,
        createdByUserId: driver1.id,
        createdAt: minutesAgo(150),
      },
    ],
  });

  // 3: IN_TRANSIT
  const s3 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010003",
      customerId: customer2.id,
      senderName: "Amritsar Handicrafts",
      senderEmail: "crafts@amritsar.org",
      senderAddress: "Heritage Street, Amritsar",
      receiverName: "Sunita Kapoor",
      receiverEmail: "sunita@outlook.com",
      receiverPhone: "+91-9876503333",
      receiverAddress: "Civil Lines, Ludhiana",
      originLat: hubAmritsar.lat,
      originLng: hubAmritsar.lng,
      destLat: hubLudhiana.lat,
      destLng: hubLudhiana.lng,
      originHubId: hubAmritsar.id,
      destHubId: hubLudhiana.id,
      weightKg: 8.2,
      type: "Fragile Decor",
      status: ShipmentStatus.IN_TRANSIT,
      assignedDriverId: driver2.id,
      vehicleId: vehicle2.id,
      createdAt: minutesAgo(240),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s3.id,
        status: ShipmentStatus.CREATED,
        note: "Consignment created in Amritsar",
        createdByUserId: staff1.id,
        createdAt: minutesAgo(240),
      },
      {
        shipmentId: s3.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Package picked up from artisan workshop",
        createdByUserId: driver2.id,
        createdAt: minutesAgo(200),
      },
      {
        shipmentId: s3.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Vehicle en-route on Grand Trunk Highway",
        lat: 31.326,
        lng: 75.5762,
        createdByUserId: driver2.id,
        createdAt: minutesAgo(120),
      },
    ],
  });

  // 4: OUT_FOR_DELIVERY
  const s4 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010004",
      customerId: customer1.id,
      senderName: "Delhi Book Depot",
      senderEmail: "books@delhibooks.com",
      senderAddress: "Daryaganj, Old Delhi",
      receiverName: "Manav Joshi",
      receiverEmail: "manav@gmail.com",
      receiverPhone: "+91-9876504444",
      receiverAddress: "Sector 22 Market, Chandigarh",
      originLat: hubDelhi.lat,
      originLng: hubDelhi.lng,
      destLat: hubChandigarh.lat,
      destLng: hubChandigarh.lng,
      originHubId: hubDelhi.id,
      destHubId: hubChandigarh.id,
      weightKg: 3.1,
      type: "Books & Educational",
      status: ShipmentStatus.OUT_FOR_DELIVERY,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(300),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s4.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment booked",
        createdAt: minutesAgo(300),
        createdByUserId: customer1.id,
      },
      {
        shipmentId: s4.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Picked up from Delhi warehouse",
        createdAt: minutesAgo(260),
        createdByUserId: staff2.id,
      },
      {
        shipmentId: s4.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Dispatched from Delhi Hub",
        createdAt: minutesAgo(200),
        createdByUserId: staff2.id,
      },
      {
        shipmentId: s4.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        note: "Driver is out for final doorstep delivery",
        lat: 30.7300,
        lng: 76.7750,
        createdAt: minutesAgo(40),
        createdByUserId: driver1.id,
      },
    ],
  });

  // 5: DELIVERED
  const s5 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010005",
      customerId: customer2.id,
      senderName: "Ludhiana Auto Spares",
      senderEmail: "dispatch@ludhianaauto.com",
      senderAddress: "Focal Point Phase V, Ludhiana",
      receiverName: "Harpreet Kaur",
      receiverEmail: "harpreet@gmail.com",
      receiverPhone: "+91-9876505555",
      receiverAddress: "Mall Road, Amritsar",
      originLat: hubLudhiana.lat,
      originLng: hubLudhiana.lng,
      destLat: hubAmritsar.lat,
      destLng: hubAmritsar.lng,
      originHubId: hubLudhiana.id,
      destHubId: hubAmritsar.id,
      weightKg: 18.5,
      type: "Machinery Spares",
      status: ShipmentStatus.DELIVERED,
      assignedDriverId: driver2.id,
      vehicleId: vehicle2.id,
      createdAt: minutesAgo(600),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s5.id,
        status: ShipmentStatus.CREATED,
        note: "Order confirmed",
        createdAt: minutesAgo(600),
        createdByUserId: customer2.id,
      },
      {
        shipmentId: s5.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Picked up at factory loading bay",
        createdAt: minutesAgo(500),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s5.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Arrived at Amritsar Hub",
        createdAt: minutesAgo(350),
        createdByUserId: staff1.id,
      },
      {
        shipmentId: s5.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        note: "Out for final delivery",
        createdAt: minutesAgo(180),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s5.id,
        status: ShipmentStatus.DELIVERED,
        note: "Delivery OTP verified. Handed over to recipient.",
        lat: hubAmritsar.lat,
        lng: hubAmritsar.lng,
        createdAt: minutesAgo(60),
        createdByUserId: driver2.id,
      },
    ],
  });

  // 6: FAILED
  const s6 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010006",
      customerId: customer1.id,
      senderName: "Chandigarh Dairy Organics",
      senderEmail: "fresh@chddairy.in",
      senderAddress: "Industrial Area Phase 1, Chandigarh",
      receiverName: "Rajesh Khanna",
      receiverEmail: "rajesh@gmail.com",
      receiverPhone: "+91-9876506666",
      receiverAddress: "Karol Bagh, New Delhi",
      originLat: hubChandigarh.lat,
      originLng: hubChandigarh.lng,
      destLat: hubDelhi.lat,
      destLng: hubDelhi.lng,
      originHubId: hubChandigarh.id,
      destHubId: hubDelhi.id,
      weightKg: 5.0,
      type: "Perishables",
      status: ShipmentStatus.FAILED,
      assignedDriverId: driver2.id,
      vehicleId: vehicle2.id,
      createdAt: minutesAgo(400),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s6.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment registered",
        createdAt: minutesAgo(400),
        createdByUserId: customer1.id,
      },
      {
        shipmentId: s6.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Picked up from cold storage",
        createdAt: minutesAgo(350),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s6.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Transit to Delhi Hub completed",
        createdAt: minutesAgo(240),
        createdByUserId: staff1.id,
      },
      {
        shipmentId: s6.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        note: "Out for delivery attempt 1",
        createdAt: minutesAgo(120),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s6.id,
        status: ShipmentStatus.FAILED,
        note: "Delivery failed: Recipient unreachable at address",
        lat: hubDelhi.lat,
        lng: hubDelhi.lng,
        createdAt: minutesAgo(30),
        createdByUserId: driver2.id,
      },
    ],
  });

  // 7: RESCHEDULED
  const s7 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010007",
      customerId: customer2.id,
      senderName: "Amritsar Woolens",
      senderEmail: "sales@amritsarwool.in",
      senderAddress: "Katra Jaimal Singh, Amritsar",
      receiverName: "Simranjit Kaur",
      receiverEmail: "simran@gmail.com",
      receiverPhone: "+91-9876507777",
      receiverAddress: "Model Town, Ludhiana",
      originLat: hubAmritsar.lat,
      originLng: hubAmritsar.lng,
      destLat: hubLudhiana.lat,
      destLng: hubLudhiana.lng,
      originHubId: hubAmritsar.id,
      destHubId: hubLudhiana.id,
      weightKg: 6.7,
      type: "Apparel",
      status: ShipmentStatus.RESCHEDULED,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(480),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s7.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment booked",
        createdAt: minutesAgo(480),
        createdByUserId: customer2.id,
      },
      {
        shipmentId: s7.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Picked up by driver",
        createdAt: minutesAgo(400),
        createdByUserId: driver1.id,
      },
      {
        shipmentId: s7.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Arrived at Ludhiana facility",
        createdAt: minutesAgo(300),
        createdByUserId: staff1.id,
      },
      {
        shipmentId: s7.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        note: "Out for delivery attempt 1",
        createdAt: minutesAgo(200),
        createdByUserId: driver1.id,
      },
      {
        shipmentId: s7.id,
        status: ShipmentStatus.FAILED,
        note: "Delivery failed: Customer requested evening delivery",
        createdAt: minutesAgo(120),
        createdByUserId: driver1.id,
      },
      {
        shipmentId: s7.id,
        status: ShipmentStatus.RESCHEDULED,
        note: "Rescheduled for tomorrow morning by dispatcher",
        createdAt: minutesAgo(45),
        createdByUserId: staff1.id,
      },
    ],
  });

  // 8: RETURNED
  const s8 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010008",
      customerId: customer1.id,
      senderName: "Chandigarh Optical Works",
      senderEmail: "optics@chdoptical.com",
      senderAddress: "Sector 8-C, Chandigarh",
      receiverName: "Unknown Consignee",
      receiverEmail: "fake@invalid.com",
      receiverPhone: "+91-9876508888",
      receiverAddress: "Nonexistent Street, Delhi",
      originLat: hubChandigarh.lat,
      originLng: hubChandigarh.lng,
      destLat: hubDelhi.lat,
      destLng: hubDelhi.lng,
      originHubId: hubChandigarh.id,
      destHubId: hubDelhi.id,
      weightKg: 1.2,
      type: "Optical Frames",
      status: ShipmentStatus.RETURNED,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(720),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s8.id,
        status: ShipmentStatus.CREATED,
        note: "Shipment created",
        createdAt: minutesAgo(720),
        createdByUserId: customer1.id,
      },
      {
        shipmentId: s8.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Picked up",
        createdAt: minutesAgo(650),
        createdByUserId: driver1.id,
      },
      {
        shipmentId: s8.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Sent to Delhi Hub",
        createdAt: minutesAgo(500),
        createdByUserId: staff1.id,
      },
      {
        shipmentId: s8.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        note: "Attempted delivery",
        createdAt: minutesAgo(350),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s8.id,
        status: ShipmentStatus.FAILED,
        note: "Address invalid, receiver rejected parcel",
        createdAt: minutesAgo(200),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s8.id,
        status: ShipmentStatus.RETURNED,
        note: "Consignment returned to origin sender in Chandigarh",
        lat: hubChandigarh.lat,
        lng: hubChandigarh.lng,
        createdAt: minutesAgo(50),
        createdByUserId: staff2.id,
      },
    ],
  });

  // 9: IN_TRANSIT (Additional active shipment)
  const s9 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010009",
      customerId: customer2.id,
      senderName: "Delhi Medical Supplies",
      senderEmail: "dispatch@delhimed.com",
      senderAddress: "Okhla Industrial Area, Delhi",
      receiverName: "Amritsar Medical Center",
      receiverEmail: "supplies@amritsarmed.org",
      receiverPhone: "+91-9876509999",
      receiverAddress: "Circular Road, Amritsar",
      originLat: hubDelhi.lat,
      originLng: hubDelhi.lng,
      destLat: hubAmritsar.lat,
      destLng: hubAmritsar.lng,
      originHubId: hubDelhi.id,
      destHubId: hubAmritsar.id,
      weightKg: 24.0,
      type: "Medical Equipment",
      status: ShipmentStatus.IN_TRANSIT,
      assignedDriverId: driver2.id,
      vehicleId: vehicle2.id,
      createdAt: minutesAgo(160),
    },
  });
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: s9.id,
        status: ShipmentStatus.CREATED,
        note: "Medical priority shipment booked",
        createdAt: minutesAgo(160),
        createdByUserId: staff2.id,
      },
      {
        shipmentId: s9.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Loaded at medical warehouse",
        createdAt: minutesAgo(120),
        createdByUserId: driver2.id,
      },
      {
        shipmentId: s9.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Express overnight route active",
        lat: 29.3909,
        lng: 76.9635,
        createdAt: minutesAgo(40),
        createdByUserId: driver2.id,
      },
    ],
  });

  // 10: CREATED (Additional new shipment for testing pickup OTP)
  const s10 = await prisma.shipment.create({
    data: {
      trackingId: "SHP-10010010",
      customerId: customer1.id,
      senderName: "Ludhiana Cycle Components",
      senderEmail: "sales@ludhianacycle.com",
      senderAddress: "Gill Road, Ludhiana",
      receiverName: "Rohit Dhawan",
      receiverEmail: "rohit.dhawan@gmail.com",
      receiverPhone: "+91-9876510000",
      receiverAddress: "South Extension, New Delhi",
      originLat: hubLudhiana.lat,
      originLng: hubLudhiana.lng,
      destLat: hubDelhi.lat,
      destLng: hubDelhi.lng,
      originHubId: hubLudhiana.id,
      destHubId: hubDelhi.id,
      weightKg: 7.5,
      type: "Cycle Parts",
      status: ShipmentStatus.CREATED,
      assignedDriverId: driver1.id,
      vehicleId: vehicle1.id,
      createdAt: minutesAgo(15),
    },
  });
  await prisma.shipmentEvent.create({
    data: {
      shipmentId: s10.id,
      status: ShipmentStatus.CREATED,
      note: "Shipment newly registered and awaiting pickup verification",
      lat: hubLudhiana.lat,
      lng: hubLudhiana.lng,
      createdByUserId: customer1.id,
      createdAt: minutesAgo(15),
    },
  });

  console.log("✓ Seeded 10 shipments spanning all lifecycle statuses with complete event histories");
  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
