# Research Summary: Bidstand

## Key Findings

### Stack
- **Web App**: Next.js 15 (TypeScript, Zod, JWT)
- **Sockets Server**: Express + Socket.io 4.x
- **ORM & DB**: Prisma + PostgreSQL
- **Validation & Auth**: Zod schema validation, Room-scoped JWT sessions

### Table Stakes
- Room Creation, Room Joining (Lobby/Share code), Player display card, Server-authoritative timer, Realtime bidding updates, Live bid history log, Results summary.

### Watch Out For
- Floating-point arithmetic errors (use Lakhs integers)
- Client-side timer desynchronization (strictly server-authoritative timers)
- Concurrency race conditions on simultaneous bids (sequential processing on server)
- Network disconnects (JWT cookies/localStorage persistence for automatic session recovery)
