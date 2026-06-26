# Stack Research: Bidstand

## Technology Stack

### Core Technologies
- **Next.js 15 (App Router)**: Frontend application, static pages (Lobby, Join, Dashboard, Results), and REST-ish API endpoints for authentication and room configuration.
- **Express + Socket.io 4.x**: Separate server for realtime websocket communication, authoritative countdown timers, and live bidding state machine logic.
- **Prisma + PostgreSQL**: Database schema management, ORM, and persistent storage of rooms, teams, players, and auction outcomes.
- **TypeScript**: Shared type definitions across `apps/web` (Next.js), `apps/realtime` (Socket.io), and `packages/shared`.
- **Zod**: Input schema validation for all API bodies and Socket.io incoming payloads to guarantee server-side correctness.
- **JSON Web Tokens (jsonwebtoken)**: Room-scoped authorization signed by a shared secret (`ROOM_JWT_SECRET`) between Next.js and Socket.io servers.

### Styling
- **Tailwind CSS**: Rapid UI styling using utility classes (or Vanilla CSS for layout components if configured).

### Key Libraries
- **Lucide React**: Premium micro-icon set.
- **Canvas-Confetti**: Client-side feedback on successful player sale.
