# Phase 1: Foundation & Lobby - Research

**Researched:** 2026-06-26
**Phase:** 1 - Foundation & Lobby
**Goal:** Database setup, REST APIs for room creation, and lobby joining
**Requirements:** ROOM-01, ROOM-02, ROOM-03, TECH-01

## Research Complete

Phase 1 should be planned as the first vertical MVP slice. The repository currently contains planning/specification documents but no application scaffold, so the plan must create the workspace structure before implementing feature code:

- `apps/web` for Next.js App Router UI and REST-ish API routes.
- `apps/realtime` for the Express + Socket.io server.
- `packages/db` for Prisma schema and client access.
- `packages/shared` for Zod schemas and shared TypeScript contracts.

The phase should stop before live auction bidding/timer resolution. It should deliver persisted room setup, room-code joining, room-scoped identity, and lobby presence/listing sufficient for Phase 2 to attach authoritative auction state.

## Canonical References

The planner and executor must read these before implementing Phase 1:

- `AGENTS.md` - project rules, especially strict TypeScript, Zod validation, security, and realtime authority boundaries.
- `.planning/REQUIREMENTS.md` - mapped Phase 1 requirements and traceability.
- `.planning/ROADMAP.md` - Phase 1 scope and success criteria.
- `docs/PRD.md` - domain assumptions, roles, feature boundaries, non-goals, and open assumptions.
- `docs/ARCHITECTURE.md` - monorepo structure, auth design, realtime topology, environment variables, and error handling baseline.
- `docs/DATABASE_SCHEMA.md` - Prisma models and rationale.
- `docs/USER_FLOWS.md` - create room, join, lobby, edge cases, and state requirements.
- `docs/DESIGN_SYSTEM.md` - lobby/dashboard/create-room UI direction and component expectations.

## Scope Interpretation

### ROOM-01: Commissioner Room Creation

Room creation needs a real Commissioner account, a persisted `Room`, configured `Team` rows, and persisted `Item` rows. The minimum create-room surface should support:

- room name
- default purse per team, stored as integer lakhs
- timer duration in seconds
- increment rule as JSON
- squad size cap
- role caps as JSON
- team names
- player pool with name, category, base price, optional image URL, and auction order

The plan should include server-side validation for all create-room inputs. Client forms may improve usability, but the API route must remain authoritative for accepted shapes and constraints.

### ROOM-02: Join by Room Code or Link

The system needs a six-character room code and a join flow at `/join/[code]`. Joining should not rely on public room directories or search. Invalid codes need a friendly recoverable state, not an unhandled error.

The join API should create or reattach a `Participant` based on a browser-scoped `anonId` and the target room. The web app should issue a room-scoped JWT after successful join so Phase 2 can reuse the same session model for sockets.

### ROOM-03: Role Claiming

Phase 1 must distinguish:

- Commissioner: authenticated real account that owns the room.
- Team Owner: room-scoped participant claiming exactly one available `Team`.
- Spectator: room-scoped participant with no team and no bidding rights.

Team claims must be checked server-side. A hidden UI control is not access control. Team Owner joins must reject already claimed teams unless the same `anonId` is reattaching to its existing participant/team relationship.

### TECH-01: PostgreSQL Persistence

The Prisma schema from `docs/DATABASE_SCHEMA.md` should be the source of truth, with currency stored as integer lakhs. Phase 1 should include enough database lifecycle setup to run locally:

- workspace package for Prisma
- schema enums/models
- generated client export
- `.env.example` placeholders
- migration/dev command wired through `pnpm`

If local PostgreSQL/Neon is not available during execution, the executor should still create schema/config and document the exact migration command to run.

## Implementation Architecture

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Commissioner authentication | `apps/web` API routes | `packages/db` | Credentials and password hashes must be handled server-side against persisted `User` rows. |
| Room creation | `apps/web` API routes | `packages/shared`, `packages/db` | API validates create-room payloads with shared Zod schemas and persists room/team/item rows in one transaction. |
| Room code joining | `apps/web` API routes | `packages/shared`, `packages/db` | Join requests are untrusted client input; the API must validate role/team claims and persist/reattach participants. |
| Room-scoped JWT minting | `apps/web` API routes | `packages/shared` | The web server issues signed room-scoped tokens after database-backed authorization checks. |
| Lobby presence broadcasting | `apps/realtime` | `packages/db`, `packages/shared` | Socket server verifies room-scoped JWTs, joins Socket.io rooms, updates participant presence, and broadcasts canonical lobby state. |
| Lobby rendering | `apps/web` UI | `apps/realtime` | Browser renders room code, team claims, participant presence, and connection state; it never asserts authority. |
| Persistent auction entities | `packages/db` | `apps/web`, `apps/realtime` | Prisma schema is shared by both server apps and remains the source of truth for rooms, teams, items, bids, and participants. |

### Monorepo Foundation

Use `pnpm` workspaces matching `AGENTS.md`:

```text
apps/web/
apps/realtime/
packages/db/
packages/shared/
```

Top-level scripts should include at least:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @bidstand/db prisma migrate dev`
- `pnpm --filter @bidstand/web dev`
- `pnpm --filter @bidstand/realtime dev`

Strict TypeScript should be configured from the beginning. Avoid `any`; use `unknown` and narrow with Zod or explicit guards.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | current npm stable at install time | Web app, App Router UI, API routes | Matches project architecture and Vercel deployment target. |
| `react`, `react-dom` | current npm stable at install time | UI rendering | Required by Next.js. |
| `typescript` | current npm stable at install time | Strict typing across workspace | Required by project code style. |
| `prisma`, `@prisma/client` | current npm stable at install time | PostgreSQL ORM and generated client | Matches `docs/DATABASE_SCHEMA.md` and shared DB package design. |
| `zod` | current npm stable at install time | Runtime validation and type inference | Required for API/socket input validation. |
| `next-auth` / `@auth/core` | current npm stable at install time | Commissioner credentials auth | Preferred by `docs/ARCHITECTURE.md`; executor may use a lean compatible setup only if Auth.js setup blocks the slice. |
| `bcryptjs` | current npm stable at install time | Password hashing | Avoids native build friction for local assignment environments. |
| `jose` | current npm stable at install time | Room-scoped JWT signing/verification | Works well in modern web/server runtimes. |
| `express`, `socket.io`, `socket.io-client` | current npm stable at install time | Realtime lobby server and client socket | Matches standalone realtime server architecture. |
| `tsx` | current npm stable at install time | TypeScript dev runner for realtime app | Simple local Node development loop. |
| `vitest` | current npm stable at install time | Unit tests for schemas/auth/code generation | Fast TypeScript test runner. |
| `tailwindcss` | current npm stable at install time | Styling | Matches `docs/DESIGN_SYSTEM.md`. |
| `lucide-react` | current npm stable at install time | UI icons | Matches frontend guidance and project research. |

## Package Legitimacy Audit

> Required because Phase 1 will install npm packages. `slopcheck --json` was unavailable in the installed CLI, and `slopcheck install ...` checked PyPI rather than npm, then failed because the registry was unreachable in this sandbox. No package was verified as `[OK]` during this run. Planner must add a blocking package verification checkpoint before installation.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `next` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `react` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `react-dom` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `typescript` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `zod` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `prisma` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `@prisma/client` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `next-auth` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `@auth/core` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `bcryptjs` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `jose` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `express` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `socket.io` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `socket.io-client` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `tsx` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `vitest` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `tailwindcss` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |
| `lucide-react` | npm | not verified in sandbox | not verified in sandbox | not verified in sandbox | [ASSUMED] | Gate before install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
**Packages requiring human verification due to [ASSUMED]:** all listed npm packages above

### Database Schema

Adapt the schema in `docs/DATABASE_SCHEMA.md` into `packages/db/prisma/schema.prisma`. The schema already defines the correct core entities:

- `User`
- `Room`
- `Team`
- `Item`
- `Bid`
- `Participant`
- `RoomStatus`
- `ItemStatus`
- `ParticipantRole`

Planning should include at least one seed/demo path or fixture strategy if time allows, because `docs/PRD.md` asks for evaluator-friendly demo data. This can be a later task in the same plan if the single plan remains manageable.

### Shared Contracts

Put API and socket-facing payload schemas in `packages/shared`. For Phase 1, minimum schemas should include:

- commissioner signup/login request schemas
- create-room request schema
- join-room request schema
- room code param schema
- lobby snapshot schema
- typed error response schema

Even if Phase 1 implements only a minimal realtime lobby, shared schemas should establish the pattern Phase 2 will extend for socket events.

### Authentication and Sessions

Commissioner auth can be implemented with Auth.js Credentials provider or a minimal credentials flow if the scaffold chooses a smaller first slice. The key constraints are:

- passwords must be hashed with bcrypt or an equivalent password hashing library
- Commissioner identity is a real account
- room-scoped JWTs are signed with `ROOM_JWT_SECRET`
- `ROOM_JWT_SECRET` must exist in both `apps/web/.env.example` and `apps/realtime/.env.example`
- room-scoped tokens must include room, participant, role, and optional team claims

For Phase 1, the join API can set an httpOnly cookie and return enough safe client data to render the lobby. Do not expose password hashes or raw secrets.

### Lobby Realtime

Phase 1 success criteria explicitly require joined teams to be listed in real time in the room lobby. The minimum acceptable implementation is not auction bidding; it is lobby presence/snapshot broadcasting:

- `apps/realtime` accepts socket connections with a room-scoped JWT.
- Client emits or handshakes a room join intent for a room code/session token.
- Server validates the token, joins the Socket.io room, fetches canonical room/lobby state from Postgres, and emits `room:state`.
- On connect/disconnect, server updates participant presence and broadcasts `presence:update` or a refreshed lobby state.

If implementing the realtime server in the same plan risks excessive breadth, the planner should still include it because it is part of the Phase 1 success criteria. It can be the final task after REST join APIs and database models are in place.

## UI Surface Needed in Phase 1

Phase 1 has user-facing screens and should be treated as a UI phase:

- landing/auth entry for Commissioner
- dashboard or direct create-room entry
- create-room wizard or compact create-room form
- `/join/[code]` role claim screen
- `/room/[code]/lobby` lobby screen with room code/share link and live team list

Follow `docs/DESIGN_SYSTEM.md`: dark scoreboard/broadcast feel, large monospace room code, clear loading/empty/error states, and a two-column lobby layout. The UI-SPEC gate is applicable before planning unless the operator intentionally skips it.

## Security and Validation Notes

Planner should include a threat model in PLAN.md because `workflow.security_enforcement` is enabled.

Important Phase 1 threats:

- forged role claims in join requests
- team ownership hijacking by submitting another team id
- duplicate or predictable room codes
- raw password or token leakage
- trusting client-submitted Commissioner status
- malformed role caps/increment rule JSON causing later auction validation gaps
- missing origin/CORS controls between web and realtime server

Mitigation themes:

- validate every API body with Zod from `packages/shared`
- derive Commissioner authority from authenticated server session
- derive Team Owner/Spectator authority from signed room JWT and database state
- generate room codes server-side with collision checks
- store secrets only in `.env`, commit only `.env.example`

## Testing Strategy

Minimum verification commands for Phase 1 plans:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @bidstand/db prisma validate`
- `pnpm --filter @bidstand/db prisma migrate dev` when a database URL is available

Recommended focused tests:

- create-room schema rejects empty teams, empty players, duplicate team names, invalid base prices, and invalid timer durations
- join-room schema rejects invalid room codes, missing display names, and invalid role/team combinations
- room-code generation handles collisions
- room-scoped JWT creation and verification round-trips claims
- Team Owner cannot claim an already claimed team
- Spectator can join without a team

Manual validation should cover at least two browser profiles joining the same lobby and seeing the team roster/presence update without refresh. Full 3+ browser bidding validation belongs mainly to Phase 2/3, but Phase 1 should prove lobby realtime wiring.

## Planning Recommendations

The roadmap asks for one plan: `01-01: Database setup, API routes for room/lobby setup, and basic JWT auth.`

Because the repository has no app scaffold yet, that single plan should be split into ordered tasks inside one PLAN.md:

1. Create pnpm monorepo scaffolding and strict TypeScript config.
2. Add Prisma schema/package and environment examples.
3. Add shared Zod schemas/types for auth, room creation, joining, and lobby snapshots.
4. Build Commissioner auth and room creation API.
5. Build join-room API with room-scoped JWT and participant/team claim persistence.
6. Build minimal web UI for create/join/lobby states.
7. Build minimal realtime lobby presence server and client socket integration.
8. Run schema validation, typecheck, lint, and targeted tests.

The plan must keep Phase 2 auction logic out of scope. Do not implement bidding validation, auction timers, sold/unsold resolution, pause/resume, current player display, or results page in Phase 1 except for schema fields needed to support them later.

## Risks and Landmines

- The architecture doc says Next.js 14 while project research says Next.js 15. Use the package version available at implementation time, but do not rely on unstable APIs unless the generated app version requires them.
- `docs/DATABASE_SCHEMA.md` uses `Item`, not `Player`, intentionally. Keep user-facing copy as player-centric while preserving generic schema names unless the executor makes an explicit schema decision.
- Room creation spans multiple related tables. Use a Prisma transaction for creating room, teams, and items together.
- A six-character code must be unique. Generate, check collision, and retry rather than trusting a single random draw.
- Lobby realtime should read canonical state from the database. Do not let the socket server become the only source of participant/team state.
- The current repo lacks `package.json`; plan tasks must include dependency installation and generated config files, not just application code.

## Open Questions (RESOLVED)

1. **Auth implementation** — RESOLVED: Plan for Auth.js-compatible Commissioner credentials using hashed passwords and server-managed sessions; executor may keep the implementation lean inside Next.js route handlers if full Auth.js setup blocks the walking skeleton.
2. **Seed/demo data** — RESOLVED: Do not make demo seed data a Phase 1 must-have; Phase 1 creates real room/team/player inputs, and Phase 3 can add evaluator polish if needed.
3. **Lobby socket events** — RESOLVED: Use full `room:state` snapshots or `presence:update` broadcasts from canonical database state; either is acceptable if lobby roster convergence is proven.

## RESEARCH COMPLETE
