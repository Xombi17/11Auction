# Walking Skeleton - Bidstand

**Phase:** 1
**Generated:** 2026-06-26

## Capability Proven End-to-End

A Commissioner can create a persisted auction room and a second browser can join it by room code, producing a live lobby roster update.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js App Router in `apps/web` | Serves UI routes and REST-ish API routes from one deployable web app, matching `docs/ARCHITECTURE.md`. |
| Data layer | PostgreSQL + Prisma in `packages/db` | Shared database contract for web and realtime apps with the schema already specified in `docs/DATABASE_SCHEMA.md`. |
| Validation | Zod schemas in `packages/shared` | Keeps API and socket payload validation centralized and type-safe. |
| Auth | Commissioner credentials plus room-scoped JWT sessions | Matches the product split between real Commissioner accounts and frictionless room participants. |
| Realtime | Express + Socket.io in `apps/realtime` | Keeps live lobby and later auction authority out of serverless Next.js route handlers. |
| Deployment target | Vercel for `apps/web`; Railway or Render for `apps/realtime` | Matches the architecture topology and websocket process requirement. |
| Directory layout | `apps/web`, `apps/realtime`, `packages/db`, `packages/shared` | Matches `AGENTS.md` and supports shared contracts without cross-app duplication. |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner)
- [ ] Routing - `/`, `/dashboard`, `/rooms/new`, `/join/[code]`, `/room/[code]/lobby`
- [ ] Database - real room/team/item/participant writes and lobby reads
- [ ] UI - create room, join room, and lobby roster interactions wired to APIs/socket state
- [ ] Deployment - documented local full-stack run commands for web, realtime, and Prisma migration

## Out of Scope (Deferred to Later Slices)

- Auction start, pause, resume, and completed state transitions
- Current player display
- Bid placement and bid validation
- Server-authoritative countdown timer resolution
- SOLD/UNSOLD outcome handling
- Results page
- Chat, emoji reactions, public room directory, and payments

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: live server-authoritative auction room with bidding, timer, and state transitions
- Phase 3: completed auction results, polishing, and multi-session manual validation
