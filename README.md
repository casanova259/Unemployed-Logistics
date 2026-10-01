# LogiFlow - Logistics & Shipment Management Platform

> **BidWars 2026 | Problem Code: 441604 | Step 1 Implementation**  
> An enterprise-grade, real-time logistics and shipment orchestration platform built with Next.js 16 (App Router), PostgreSQL (Prisma ORM), Redis, Express 5 + Socket.IO, Auth.js v5, and Redux Toolkit.

---

## 🏗 System Architecture

The platform follows the reference monorepo architecture split:

```
├── docker-compose.yml              # PostgreSQL 16 & Redis 7 containers
├── docs/
│   ├── PRD.md                      # Product Requirements Document (Problem 441604)
│   └── REFERENCE_GLIDE.md          # Architecture & conventions mirrored from GLIDE
├── logistics-client/               # Next.js App Router (Business logic, UI, Auth, API, Prisma)
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (User, Hub, Vehicle, Shipment, ShipmentEvent)
│   │   └── seed.ts                 # Realistic database seeder
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages & API route handlers
│   │   │   ├── api/                # Zod-validated JSON APIs with RBAC & error handlers
│   │   │   ├── customer/           # Customer portal (Shipments list, detail, booking)
│   │   │   ├── staff/              # Operations console (Dispatcher dashboard, manage, create)
│   │   │   ├── driver/             # Driver mobile/desktop delivery console & OTP action center
│   │   │   ├── admin/              # Hub & Vehicle fleet operations
│   │   │   ├── track/              # Privacy-safe public package tracking
│   │   │   ├── login/ & register/  # Authentication with prefilled demo credentials
│   │   ├── components/             # Reusable UI components (StatusBadge, Timeline, Navbar, Forms)
│   │   ├── data/                   # Hub definitions & static constants
│   │   ├── lib/
│   │   │   ├── auth.ts             # Auth.js v5 NextAuth config (Credentials + JWT sessions)
│   │   │   ├── serverAuth.ts       # Server-side session & RBAC verification
│   │   │   ├── prisma.ts           # Prisma client singleton
│   │   │   ├── stateMachine.ts     # Pure unit-tested lifecycle state machine
│   │   │   ├── emit.ts             # Fire-and-forget realtime emit hook to socket server
│   │   │   ├── socket.ts           # Socket.IO client helper with identity handshake
│   │   │   ├── errors.ts           # Centralized domain error classes (400, 401, 403, 404, 409)
│   │   │   └── services/           # Service layer: shipmentService, otpService, trackingService
│   │   ├── provider/               # Combined AppProviders (NextAuth SessionProvider, ReduxProvider)
│   │   ├── redux/                  # Redux Toolkit store, userSlice, typed hooks
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   ├── initUser.ts             # Session-aware Redux hydration & socket identity connection
│   │   └── proxy.ts                # Next 16 route protection & role redirect logic
│   └── tests/                      # Vitest test suites (State machine, OTP gating, Data isolation, Tracking)
└── logistics-server/               # Express 5 + Socket.IO realtime microservice
    └── src/index.ts                # Stateless transport service with POST /emit & identity handshake
```

---

## ⚡ Quickstart (From a Clean Clone)

### 1. Start Infrastructure (PostgreSQL + Redis)
```bash
docker compose up -d
```
*Note: Starts PostgreSQL on port `5433` (configurable to `5432`) and Redis on port `6379`.*

### 2. Configure Client Environment
```bash
cd logistics-client
cp .env.example .env
```
*(The default `.env` is already configured for `localhost:5433` and socket server on `8000`).*

### 3. Run Migrations & Seed Database
```bash
# Inside logistics-client directory:
npm run prisma:migrate
npm run prisma:seed
```

### 4. Run Unit Tests
```bash
# Inside logistics-client directory:
npm test
```
*Executes all 4 Vitest test suites:*
- `tests/stateMachine.test.ts` (All valid transitions, skips rejected, terminal statuses)
- `tests/otpGating.test.ts` (CREATED->PICKED_UP & OUT_FOR_DELIVERY->DELIVERED OTP verification, hashing, expiry)
- `tests/customerIsolation.test.ts` (Customer data strictly isolated, 403 on foreign shipments)
- `tests/publicTracking.test.ts` (Guaranteed zero PII in public tracking payload)

### 5. Start Realtime Socket Service
```bash
cd ../logistics-server
npm install
npm run dev
```
*Runs on `http://localhost:8000`.*

### 6. Start Client Web Application
```bash
cd ../logistics-client
npm run dev
```
*Runs on `http://localhost:3000`.*

---

## 🔑 Pre-Seeded Logins for Live Demos

All passwords are listed below. Clickable pre-fill shortcuts are also available directly on the `/login` page:

| Role | Name | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- | :--- |
| **STAFF (Dispatcher)** | Rohan Verma | `staff1@logistics.com` | `staff123` | `/staff/dashboard`, `/staff/shipments/*`, `/track/*` |
| **STAFF (Operations)** | Pooja Sharma | `staff2@logistics.com` | `staff123` | Operations management, OTP override |
| **DRIVER** | Gurpreet Singh | `driver1@logistics.com` | `driver123` | `/driver/assignments`, `/driver/shipments/*` |
| **DRIVER** | Amit Patel | `driver2@logistics.com` | `driver123` | Assigned shipments & delivery action center |
| **CUSTOMER** | Neha Gupta | `customer1@logistics.com` | `customer123` | `/customer/shipments`, `/customer/shipments/new` |
| **CUSTOMER** | Vikram Malhotra | `customer2@logistics.com` | `customer123` | Own shipments only (isolated) |
| **ADMIN** | Admin Superuser | `admin@logistics.com` | `admin123` | Full access: `/admin/hubs`, `/admin/vehicles`, `/staff/*` |

---

## 📦 Lifecycle State Machine & OTP Handshake

### Status Progression
```
CREATED ──(Sender OTP)──► PICKED_UP ────► IN_TRANSIT ────► OUT_FOR_DELIVERY ──(Receiver OTP)──► DELIVERED (Terminal)
                                                                 │
                                                                 ▼
RETURNED (Terminal) ◄──── FAILED ◄───────────────────────────────┘
                            │
                            ▼
                       RESCHEDULED ────► OUT_FOR_DELIVERY
```

### OTP Verification Rules
1. **Pickup Step (`CREATED -> PICKED_UP`)**:
   - Generic `PATCH /api/shipments/[id]/status` **strictly rejects** this transition with `400 Bad Request`.
   - Must be verified via `POST /api/shipments/[id]/otp/pickup/send` and `/verify`.
   - Sends 6-digit code to `senderEmail`. In development mode (`NODE_ENV=development`), the code is printed to the server console AND returned in the API response for instant demoing.
2. **Delivery Step (`OUT_FOR_DELIVERY -> DELIVERED`)**:
   - Generic `PATCH /api/shipments/[id]/status` **strictly rejects** this transition with `400 Bad Request`.
   - Must be verified via `POST /api/shipments/[id]/otp/delivery/send` and `/verify`.
   - Sends 6-digit code to `receiverEmail`.
3. **Audit Trail**: Every state transition writes an immutable, append-only `ShipmentEvent` inside the same database transaction.
4. **Realtime Hook**: Every status transition triggers `emitShipmentChanged(shipment, event)` which notifies the socket microservice with `x-socket-emit-secret`.

---

## 🔒 Security & Privacy Guarantees
- **Customer Data Isolation**: Service layer strictly enforces `where: { customerId: user.id }`. Accessing a foreign shipment returns `403 Forbidden`.
- **Public Tracking Sanitization**: `GET /api/track/[trackingId]` strips all sender/receiver contact information (email, phone, street address). Only destination city, coordinates, status badge, and public event timeline are returned.
- **Route Protection**: Next 16 `src/proxy.ts` guarantees unauthenticated requests are redirected to `/login` and users can only access routes authorized for their role.
