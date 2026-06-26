# Bidstand — Architecture & Tech Stack

## 1. Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | One framework for landing/dashboard/auction UI, good Vercel deploy story |
| Styling/UI | Tailwind CSS + shadcn/ui | Fast to get clean, consistent UI without bespoke CSS |
| Auth | Auth.js (NextAuth) — Credentials provider | Real accounts for Commissioners only; bcrypt-hashed passwords |
| Realtime | Socket.io on a standalone Node + Express server | Full control over timer authority, room semantics, presence — see §3 |
| Database | PostgreSQL (Neon, serverless-friendly) | Free tier, branching for dev/preview, plays well with Prisma |
| ORM | Prisma | Type-safe schema shared by both the web app and the realtime server |
| Frontend deploy | Vercel | Native Next.js hosting |
| Realtime server deploy | Railway or Render | Persistent Node process — required for Socket.io + long-lived timers; Vercel serverless functions cannot hold a websocket connection open |
| Monorepo tool | pnpm workspaces (or Turborepo if you want build caching) | Keeps frontend/backend/shared types in one repo without a build framework fight |

This satisfies the assignment's "clear separation between frontend, backend, database,
and realtime logic" requirement structurally, not just by convention.

## 2. Repository Layout

```
bidstand/
├── apps/
│   ├── web/                 # Next.js app (frontend + REST-ish API routes)
│   │   ├── app/
│   │   ├── lib/
│   │   └── ...
│   └── realtime/             # Express + Socket.io server
│       ├── src/
│       │   ├── server.ts
│       │   ├── rooms/        # per-room state machine, in-memory + DB-backed
│       │   └── events/       # socket event handlers
│       └── ...
├── packages/
│   ├── db/                   # Prisma schema + generated client, shared by both apps
│   └── shared/                # Zod schemas, shared TS types, socket event contracts
├── docs/                      # this doc set
├── ai-transcripts/
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

Why a separate `realtime` app instead of Next.js API routes / route handlers: Next on
Vercel runs API routes as short-lived serverless functions, which cannot hold a
persistent websocket connection or an in-process countdown timer reliably. A small
always-on Node process solves this with one job — own the live auction state.

## 3. Realtime Design

### 3.1 Socket rooms
One Socket.io room per `roomCode`. Every connected client (Commissioner, Team Owner,
Spectator) joins that room on connect; nothing is broadcast outside it.

### 3.2 Events (contract lives in `packages/shared`)

| Event | Direction | Payload | Notes |
|---|---|---|---|
| `room:join` | client → server | `{ roomCode, sessionToken }` | Validates session, joins socket room |
| `room:state` | server → client | full room snapshot | Sent on join and on any major transition |
| `auction:start` / `pause` / `resume` | client(admin) → server | `{ roomCode }` | Commissioner-only, server checks role |
| `item:current` | server → client | current item + `timerEndsAt` (ISO) | Sent when a new item goes live |
| `bid:place` | client → server | `{ roomCode, itemId, teamId, amount }` | Server validates, never trusts client math |
| `bid:accepted` | server → client | `{ itemId, teamId, amount, timerEndsAt }` | Broadcast to whole room; resets timer |
| `bid:rejected` | server → client | `{ reason }` | Sent only to the bidder, e.g. "purse exceeded" |
| `item:resolved` | server → client | `{ itemId, outcome: 'SOLD'|'UNSOLD', teamId?, amount? }` | |
| `auction:completed` | server → client | final results payload | |
| `presence:update` | server → client | connected participant list | |

### 3.3 Timer authority

The single most important correctness rule in this app:

- The realtime server is the **only** thing that decides when an item resolves.
- Timer state is an absolute timestamp, `timerEndsAt`, not a relative "15 seconds left."
  Clients compute `remaining = timerEndsAt - Date.now()` locally and just re-render —
  this avoids drift from network latency and survives tab refreshes.
- The server runs one `setTimeout`/interval per active item, keyed off the same
  `timerEndsAt` it broadcast. On expiry it re-checks the canonical in-memory state
  (current highest bid) before resolving — so even if a bid landed in the same tick as
  expiry, resolution is based on actual accepted state, not a race.
- `timerEndsAt` is persisted to the `Room` row on every change, so a server restart can
  at minimum recover into a sane `PAUSED` state instead of silently corrupting an
  in-progress item.

### 3.4 Concurrency: simultaneous bids

Two Team Owners bidding "at the same time" are never actually simultaneous once they
reach the server — Node's event loop processes socket events one at a time, and each
room's state lives in one process. The handler for `bid:place`:

1. Validate against the in-memory canonical state (current price, item status, team
   purse, increment rule) — reject fast if it's stale.
2. If valid, update in-memory state **synchronously**, write the bid row to Postgres,
   then broadcast `bid:accepted`.
3. The second bidder's event is processed *after* step 2 finishes, sees the new current
   price, and is rejected or accepted against the updated number.

This means a simple in-process check is sufficient — no database-level locking is
required because there is exactly one authoritative process per room. (If this were
ever scaled to multiple realtime server instances, you'd need a per-room lock, e.g. via
Redis — explicitly out of scope for v1, noted as a Known Limitation.)

## 4. Auth Design

- **Commissioners**: real accounts, Auth.js Credentials provider, bcrypt-hashed
  passwords, session via JWT cookie.
- **Team Owners / Spectators**: on joining a room, the web app issues a short-lived,
  room-scoped JWT (`{ roomId, participantId, role, teamId? }`) stored in an httpOnly
  cookie *and* handed to the socket connection during the handshake (`auth: { token }`).
  The realtime server verifies this token on every socket connection and on every
  privileged event (e.g. only the Commissioner's token can call `auction:start`).
- A `localStorage` anonId persists alongside the cookie so a refreshed tab can re-claim
  the same participant row instead of creating a duplicate "ghost" participant.

## 5. Deployment Topology

```
Browser ──HTTPS──▶ Vercel (Next.js: pages, API routes for CRUD)
   │                         │
   │                         ▼
   │                   Postgres (Neon)
   │                         ▲
   └──WebSocket───▶ Railway/Render (Socket.io server) ──┘
```

REST-ish operations (create room, add players, signup/login, fetch results) go through
Next.js API routes / route handlers, talking to Postgres via Prisma. Anything that needs
to be "live" goes through the Socket.io server, which talks to the *same* Postgres
database via the same Prisma schema (shared package).

## 6. Environment Variables

```
# apps/web/.env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_REALTIME_URL=https://your-realtime.up.railway.app
ROOM_JWT_SECRET=...

# apps/realtime/.env
DATABASE_URL=postgresql://...
ROOM_JWT_SECRET=...           # must match web's value
ALLOWED_ORIGIN=https://your-app.vercel.app
PORT=4000
```

`ROOM_JWT_SECRET` must be shared between both apps since both mint/verify the
room-scoped tokens. Document this clearly in `.env.example` so it's not missed.

## 7. Error Handling Baseline

- Every Prisma call in an API route / socket handler is wrapped; failures return a
  typed error shape (`{ ok: false, code, message }`), never a raw stack trace to the
  client.
- Socket disconnects are handled explicitly (`presence:update` on disconnect, participant
  marked "disconnected" not deleted, so purse/team state survives).
- Client-side: a single `SocketProvider` exposes connection status (`connecting | open |
  reconnecting | closed`) so the UI can show a reconnecting banner instead of silently
  freezing.
