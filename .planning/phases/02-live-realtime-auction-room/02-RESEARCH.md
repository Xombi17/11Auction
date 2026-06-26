# Phase 2: Live Realtime Auction Room - Research

**Researched:** 2026-06-26
**Phase:** 2 - Live Realtime Auction Room
**Goal:** Authoritative bidding, timers, socket server, and state transitions
**Requirements:** ROOM-04, ROOM-05, PLAY-01, PLAY-02, BID-01, BID-02, BID-03, TECH-02

## Research Complete

Phase 2 moves the Bidstand project from static CRUD/lobby views into the live, interactive auction experience. The realtime Socket.io server must own the timer, validate bid parameters synchronously against the database and state rules, and broadcast status transitions. The client renders this server-driven state instantly.

## Canonical References

The planner and executor must read these before implementing Phase 2:
- `AGENTS.md` - coding standards, typescript, Zod contracts, and security rules.
- `docs/ARCHITECTURE.md` - socket rooms, timer authority, concurrency control, and jwt token validation.
- `docs/DATABASE_SCHEMA.md` - models for `Room`, `Item`, `Bid`, `Team`, `Participant`.
- `docs/USER_FLOWS.md` - screens, state machine transition triggers, and edge cases.
- `docs/DESIGN_SYSTEM.md` - Design instructions for the Auction Room UI.

## Scope Interpretation

### ROOM-04: Room State Transitions
- Room transitions from `LOBBY` -> `AUCTION` -> `COMPLETED`.
- Within the `AUCTION` status:
  - If no current item exists: the server selects the first pending item (`status = PENDING` by `auctionOrder` asc), updates its status to `IN_AUCTION`, sets it as `currentItemId` in the `Room` row, sets `timerEndsAt = now + timerSeconds`, and broadcasts.
  - If all items are resolved: Room status transitions to `COMPLETED`.

### ROOM-05: Pause and Resume
- The Commissioner can pause the auction.
- When paused:
  - Room status changes to `PAUSED` (or room status remains `AUCTION` but `timerEndsAt` is set to null, and `secondsRemaining` is computed and stored). Let's use the DB `status = PAUSED` enum value!
  - The server timer is cleared.
  - When resumed, status changes back to `AUCTION`, `timerEndsAt` is recalculated as `now + secondsRemaining`, and the server timer is restarted.

### PLAY-01 & PLAY-02: Player Display & Bid History
- Active player card renders: Name, role (category), base price, current highest bid (with leading team), and timer.
- Live bid history feed lists bids chronologically (newest first).

### BID-01: Realtime Socket Bidding & Validation
Bids are sent via `bid:place`. A bid is rejected unless:
1. Room status is `AUCTION` (not `PAUSED` or `LOBBY`).
2. Item status is `IN_AUCTION`.
3. Bidding team has sufficient remaining purse (`purseRemaining >= amount`).
4. Bid amount is greater than or equal to `currentPrice + increment` (current price is current highest bid, or base price if no bids).
5. The bid is submitted by a verified member of that team (authenticated via the room-scoped JWT).
6. The bid arrives before `timerEndsAt` has passed on the server.
7. Squad cap check: the team has not reached `squadSizeCap`.
8. Role quota check: the team has not exceeded the max quota for that player's role (category).

### BID-02 & BID-03: Timer and Resolution
- Every valid bid resets `timerEndsAt` to `now + timerSeconds`.
- Upon timer expiry, the server resolves the item:
  - If high bid exists: status = `SOLD`, records `soldToTeamId` and `soldPrice`, updates `Team.purseRemaining = Team.purseRemaining - soldPrice`.
  - If no bid exists: status = `UNSOLD`.
  - Automatically loads the next player or marks the room `COMPLETED` if none remain.

## Implementation Architecture

### Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Socket Auth | `apps/realtime` | `packages/shared` | Decodes room-scoped JWT token during handshake. |
| State Machine | `apps/realtime` | `packages/db` | Express-Socket.io server manages countdown loops and transitions room/item states in PostgreSQL. |
| Bidding Rules | `apps/realtime` | `packages/shared`, `packages/db` | Server processes bids sequentially, validates math/purses, and commits bids to database. |
| Client UI | `apps/web` | `apps/realtime` | Next.js client renders countdowns, active card, history feed, and sends action proposals to the socket server. |
