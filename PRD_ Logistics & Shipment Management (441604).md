# PRD: Logistics & Shipment Management Platform

**Event:** BidWars 2026 | **Problem code:** 441604 | **Status:** Draft v1

---

## 1. Context

**Problem statement (summary).** Businesses handling deliveries need to track many orders moving between locations. Customers and staff have limited visibility into a shipment's status or location, and managing large numbers of shipments makes tracking and coordination difficult. A centralized platform is needed to manage shipments, provide location-based tracking, and make delivery information accessible to customers and logistics staff.

**Objective (from the statement).**

1. Shipments can be created and tracked throughout their delivery lifecycle.
2. Users see relevant shipment status and location information.
3. Logistics staff can manage shipments, monitor progress, and handle updates throughout delivery.

**Mandatory tech stack (top priority).**

| Layer | Technology |
| --- | --- |
| Frontend | Next.js |
| Backend | API service (Node.js/Express, TypeScript) |
| Database | PostgreSQL |
| Real-time | WebSocket / Socket.io + Redis |
| Search & analytics | Elasticsearch (AWS OpenSearch) |
| Cloud | AWS |
| ML | scikit-learn (static models): regression and classification |

*Assumption:* "aws elastic" is read as Elasticsearch on AWS OpenSearch. Confirm with the team.

**Why this problem.** It uses every part of the stack for a real purpose, the statement explicitly requires location-based tracking, and a live map demo has high visual impact.

---

## 2. Goals and non-goals

**Goals**

- G1. Cover every requirement in the statement (Section 4) with a working feature.
- G2. Use the full mandated stack, each component with a real job.
- G3. Deliver a convincing live demo: one action updates every screen in real time.
- G4. Add a differentiator: ML-based ETA and delay-risk prediction.

**Non-goals (out of scope)**

- Real payments or billing, real carrier integrations, real driver mobile app (a web driver view plus a GPS simulator is enough).
- Route optimization across many vehicles (VRP) and real traffic data.
- Multi-tenant or multi-company support.

---

## 3. Users and roles

| Role | Description | Key needs |
| --- | --- | --- |
| **Customer** | Sender or receiver of a shipment | Create shipments, see status, live location, ETA, timeline |
| **Public visitor** | Anyone with a tracking ID | View safe tracking info with no login |
| **Logistics staff (dispatcher)** | Manages operations | Create/edit/assign shipments, monitor all, handle exceptions |
| **Driver** | Delivers shipments | See assigned shipments, update status, share location |
| **Admin** | Platform owner | Manage hubs, vehicles, users; view analytics |

---

## 4. Requirements traceability (statement to feature)

| # | Requirement from statement | Feature | Stack |
| --- | --- | --- | --- |
| R1 | Shipments can be **created** | Create-shipment form: sender, receiver, origin/destination (lat/lng), weight, type. Auto-generated tracking ID. | Next.js, API, PostgreSQL |
| R2 | **Tracked throughout the delivery lifecycle** | Status state machine plus append-only event timeline | API, PostgreSQL |
| R3 | **Multiple orders moving between different locations** | Hubs, vehicles, and many concurrent shipments at different stages | PostgreSQL |
| R4 | **Centralized platform** | One app, one database, role-based views | Next.js, API, PostgreSQL |
| R5 | **Location-based tracking** | Live map with vehicle marker, route line, origin/destination pins | Socket.io, Redis GEO, Leaflet |
| R6 | **Customers see status and location** | Public tracking page with timeline, map, ETA, live updates | Next.js, Socket.io, Redis |
| R7 | **Staff manage shipments** | Staff console: create, edit, assign driver/vehicle, change status, cancel, reschedule | Next.js, API, PostgreSQL |
| R8 | **Staff monitor progress** at scale | Dispatcher dashboard: live map of all shipments, status counts, delayed list, search and filters | Elasticsearch, Socket.io, Redis |
| R9 | **Handle updates throughout delivery** | Status updates, exceptions (failed, reschedule, reassign), proof-of-delivery photo, customer notifications | API, Socket.io, S3, SNS/SES |
| R10 | **Info accessible to customers and staff** | Role-based access; public link by tracking ID | API auth |

---

## 5. Functional requirements

### 5.1 Authentication and access (R4, R10)

- FR-1. Register/login with email and password; JWT sessions.
- FR-2. Roles: CUSTOMER, STAFF, DRIVER, ADMIN, enforced server-side on every endpoint.
- FR-3. Customers can only access their own shipments; staff/admin can access all.
- FR-4. Public tracking endpoint exposes safe fields only (no phone or email).

### 5.2 Shipment creation (R1)

- FR-5. Create a shipment with sender and receiver details, origin and destination (lat/lng or pick a hub), weight, and type.
- FR-6. System generates a unique tracking ID (e.g., `SHP-XXXXXXXX`) and writes an initial CREATED event.

### 5.3 Lifecycle management (R2, R9)

- FR-7. Statuses: `CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RESCHEDULED, RETURNED`.
- FR-8. Allowed transitions only:
  - CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
  - OUT_FOR_DELIVERY → FAILED → RESCHEDULED (→ OUT_FOR_DELIVERY) or RETURNED
  - DELIVERED and RETURNED are terminal.
- FR-9. Invalid transitions return HTTP 409. Every valid change writes an append-only `ShipmentEvent` in the same DB transaction.
- FR-10. Failed delivery records a reason; reschedule records a new date.
- FR-11. Driver uploads a proof-of-delivery photo on DELIVERED (stored in S3).

### 5.4 Staff operations (R7, R8)

- FR-12. Staff console: list, filter by status, search, create, edit, assign driver and vehicle.
- FR-13. Dispatcher dashboard: status-count cards, live map of all active shipments, delayed/at-risk list.
- FR-14. Search by tracking ID, customer, city, or status with fuzzy matching (Elasticsearch).
- FR-15. Admin manages hubs, vehicles, and users.

### 5.5 Location-based tracking (R5, R6)

- FR-16. Driver view (or GPS simulator) posts location pings every 2 to 3 seconds.
- FR-17. Latest position per shipment is stored in Redis; sampled history is stored in Postgres.
- FR-18. Customer tracking page shows a live moving marker, route line, status timeline, and ETA with no refresh.
- FR-19. On socket reconnect, clients refetch current state to avoid stale data.

### 5.6 Notifications (R9)

- FR-20. Customer is notified on key status changes (picked up, out for delivery, delivered, failed) via email (SES) and optionally SMS (SNS), plus in-app live toast.

### 5.7 ML features (differentiator)

- FR-21. **Regression: ETA/duration.** Features: remaining distance, hour, weekday, vehicle type, weight, stops left. ETA shown to customer and staff, updated as the vehicle moves.
- FR-22. **Classification: delay risk (on-time vs delayed).** Features: distance, time slot, driver load, progress vs plan. At-risk shipments are highlighted on the dispatcher dashboard.
- FR-23. *Optional:* failed-delivery risk classifier.
- FR-24. Models are static: trained offline on synthetic data, saved with joblib, served by a small FastAPI service. Predictions are labeled as estimates in the UI.

---

## 6. System architecture

```
Next.js (customer / staff / driver / admin UI, Leaflet map)
        |  REST + Socket.io
   API service (Express + TS)  ---->  FastAPI ML service (scikit-learn, joblib)
     |      |        |        \
 PostgreSQL Redis  OpenSearch  S3 / SNS / SES
 (truth)  (GEO, pub/sub,  (search,
          socket adapter,  analytics)
          cache, limits)
```

**Write order (important):** Postgres transaction first, then Redis update, Elasticsearch index, and Socket.io emit. If a later step fails, Postgres remains correct and a retry can resync.

**Socket.io design**

- Rooms: `shipment:{id}` (customer), `staff` or `hub:{id}` (dispatchers), `driver:{id}` (assignments).
- Events: `shipment:created`, `shipment:status`, `shipment:location`, `shipment:eta`, `shipment:exception`.
- Redis adapter for multi-instance scaling; sticky sessions on the AWS load balancer.

**Redis roles:** latest vehicle position (GEO/hash), Socket.io adapter, pub/sub between API and sockets, GPS-ping rate limiting, tracking-page read cache.

**Elasticsearch roles:** index of shipments and events for full-text, fuzzy and geo search, plus aggregations (deliveries per day, delays per city) for admin analytics.

**AWS mapping:** ECS/EC2 or Elastic Beanstalk behind an ALB, RDS (PostgreSQL), ElastiCache (Redis), OpenSearch Service, S3 (proof of delivery), SNS/SES (notifications).

---

## 7. Data model (PostgreSQL)

- **User**(id, name, email, passwordHash, role, createdAt)
- **Hub**(id, name, city, lat, lng)
- **Vehicle**(id, plate, type, driverId?)
- **Shipment**(id, trackingId unique, customerId, senderName, senderAddress, receiverName, receiverPhone, receiverAddress, originLat/Lng, destLat/Lng, originHubId?, destHubId?, weightKg, type, status, assignedDriverId?, vehicleId?, predictedEta?, delayRisk?, createdAt, updatedAt)
- **ShipmentEvent**(id, shipmentId, status, note?, lat?, lng?, createdByUserId, createdAt): append-only
- **LocationPing**(id, shipmentId, lat, lng, recordedAt): sampled history
- **Notification**(id, shipmentId, channel, status, sentAt)
- **MlPrediction**(id, shipmentId, type, value, createdAt)

---

## 8. API outline (`/api`, JSON, zod-validated)

| Endpoint | Access |
| --- | --- |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Public / authed |
| `POST /shipments` | Customer, Staff, Admin |
| `GET /shipments` (filters, pagination, search) | Staff/Admin all; Customer own |
| `GET /shipments/:id` | Role-checked |
| `GET /track/:trackingId` | **Public**, safe fields only |
| `PATCH /shipments/:id/status` | Staff, Admin, assigned Driver |
| `PATCH /shipments/:id/assign` | Staff, Admin |
| `POST /shipments/:id/location` | Assigned Driver / simulator |
| `POST /shipments/:id/proof` | Driver (presigned S3 upload) |
| `GET /search` | Staff, Admin |
| `GET /analytics/summary` | Staff, Admin |
| `GET/POST /hubs`, `/vehicles` | Admin (read: Staff) |

---

## 9. Non-functional requirements

- **Real-time latency:** location and status updates reach clients in under 1 second on a normal network.
- **Reliability:** state transitions are transactional; clients self-heal on reconnect.
- **Security:** hashed passwords, JWT, role guards, input validation, rate limiting on pings, no PII on public tracking.
- **Privacy:** public page shows only status, timeline, coordinates, and receiver city.
- **Scalability:** stateless API instances; Redis adapter for sockets; indexed search.
- **Usability:** responsive UI, clear status badges, mobile-friendly tracking page.
- **Code quality:** strict TypeScript, central error handling, unit-tested state machine.

---

## 10. Delivery plan

| Step | Scope | Requirements covered |
| --- | --- | --- |
| 1. Foundation (MVP prompt already prepared) | Monorepo, Docker (Postgres + Redis), Prisma schema, auth and roles, shipment CRUD, state machine, seed data, basic web pages, public tracking | R1, R2, R3, R4, R7, R10 |
| 2. Real-time + map | Socket.io, Redis (GEO, adapter), GPS simulator, Leaflet live map, customer tracking page | R5, R6 |
| 3. Dispatcher dashboard | Elasticsearch/OpenSearch indexing, search and filters, status counts, live all-shipments map | R8 |
| 4. Exceptions + notifications | Failed/reschedule flow, proof-of-delivery to S3, SNS/SES alerts | R9 |
| 5. ML | Synthetic data, train ETA regression and delay classifier, FastAPI service, UI integration | FR-21 to FR-24 |
| 6. Deploy + polish | AWS deployment, role-based polish, demo script and simulator | All |

**Rule:** build R1 to R10 first. ML is added only after the core works.

---

## 11. Demo plan

1. Create a shipment in the staff console; it appears instantly on the dispatcher map and in search.
2. Open the customer tracking link in another window; the vehicle moves live.
3. Change a status; timeline, customer page, and notification update together.
4. Trigger a failed delivery, reschedule, and upload a proof-of-delivery photo.
5. Show an ETA updating and a delay-risk shipment flagged on the dashboard.
6. Try an invalid status jump and show it rejected.

---

## 12. Success criteria

- Every requirement R1 to R10 has a working, demonstrable feature.
- Every stack component (Next.js, API, PostgreSQL, Socket.io, Redis, Elasticsearch, AWS, scikit-learn) is visibly used.
- The live demo runs end to end with no manual refreshes.
- ML predictions appear in the UI and are explained as estimates from synthetic training data.

---

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Map work takes too long | Leaflet + OpenStreetMap (free, no API key); lat/lng inputs instead of geocoding |
| No real drivers for GPS data | Build a GPS simulator script that moves vehicles along routes |
| Socket scaling behind AWS load balancer | Redis adapter and sticky sessions |
| Elasticsearch/AWS setup time | Use a local container in development; deploy OpenSearch late; Postgres is always the fallback truth |
| Other teams choose the same problem | Differentiate with live map polish, delay prediction, shareable tracking link |
| Over-scoping | Strict build order; ML and notifications are cut first if time runs short |

---

## 14. Open questions

1. Confirm "aws elastic" means Elasticsearch/OpenSearch.
2. Team size, roles, and hours available before the deadline.
3. Does the hackathon require a live AWS deployment, or is a local demo acceptable?
4. Is a separate FastAPI service for the Python ML models acceptable within "API" in the stack?