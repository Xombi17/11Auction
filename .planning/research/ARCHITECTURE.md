# Architecture Research: Bidstand

## System Architecture

### Component Boundaries
1. **Next.js Web Client & API**:
   - Handles HTTP REST routes (`/api/auth/*`, `/api/rooms/*`, `/api/players/*`).
   - Renders stateful UI pages using React Server/Client Components.
   - Signs and issues room-scoped JWTs for players claiming teams.
2. **Express & Socket.io Server**:
   - Handles bidirectional socket connections.
   - Manages active in-memory room states, including active player, current high bidder, and active countdown timer.
   - Automatically synchronizes outcomes to PostgreSQL via Prisma.
3. **Database (PostgreSQL)**:
   - Schema defined in `packages/db/prisma/schema.prisma`.
   - Shared client package `packages/db` loaded by both web app and realtime server.

## Data Flow & Concurrency

### Bidding Flow
1. Client emits `bid:place` with bid amount.
2. Sockets server intercepts and validates:
   - Valid room JWT token signature & claims.
   - Room is in `AUCTION` state (not lobby, paused, or completed).
   - High bidder is not the same team.
   - Bid ≥ current price + increment.
   - Team has enough remaining purse.
   - Squad constraints (role caps, squad size limits) allow the player.
3. If valid, update in-memory state:
   - Current price = bid amount.
   - High bidder = bidder's team.
   - Reset timer to `timerEndsAt = now + timerDuration`.
4. Broadcast `bid:update` event to all clients.
5. Save state transition asynchronously to the database.
