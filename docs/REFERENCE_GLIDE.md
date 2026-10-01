# REFERENCE: GLIDE Architecture Pattern

This document summarizes the architectural structure and engineering conventions from GLIDE that are mirrored in this project.

## Architecture & Split
Two apps in a monorepo:
1. `logistics-client`:
   - Next.js (App Router, TypeScript, Tailwind v4).
   - Serves as the complete business-logic layer.
   - Houses UI pages and API route handlers (`src/app/api`).
   - Auth.js v5 (NextAuth) for credentials-based authentication with JWT sessions.
   - Redux Toolkit for client-side user state and UI state.
   - `src/proxy.ts` (Next 16 proxy pattern) for role-based route protection and redirects.
   - `src/initUser.ts` for session-aware Redux hydration on client load.
   - Folder layout:
     - `components/`: UI components (layout, forms, tables, modals)
     - `data/`: static definitions, constants, hub coordinates
     - `hooks/`: custom React hooks
     - `lib/`: services (`shipmentService.ts`, `otpService.ts`, `trackingService.ts`), `prisma.ts`, `auth.ts`, `emit.ts`, `socket.ts`, `errors.ts`
     - `provider/`: Redux provider, SessionProvider
     - `redux/`: RTK store, slices
     - `types/`: shared TypeScript types and API interfaces
     - `prisma/`: `schema.prisma`, `seed.ts`

2. `logistics-server`:
   - Express 5 + Socket.IO + TypeScript realtime service.
   - Stateless transport layer with no direct database connections.
   - Exposes `POST /emit` protected by `SOCKET_EMIT_SECRET` header.
   - Handles socket connections, room subscriptions, and identity mapping (`userId -> socketId`).

## Domain Mapping (GLIDE -> Logistics)
- `user` -> `CUSTOMER`
- `partner` -> `DRIVER`
- `admin` -> `ADMIN`
- Additional role -> `STAFF` (dispatcher / operations manager)
- `booking` -> `Shipment`
- `pickup/dropoff OTP` -> `pickup/delivery OTP`
- `ride room` -> `shipment room`
- Excluded from GLIDE: ride commissions, Razorpay payments, Zego RTC, Gemini AI chat, KYC.
