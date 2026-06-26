# Phase 1: Foundation & Lobby - Patterns

**Generated:** 2026-06-26
**Scope:** First application scaffold and lobby vertical slice

## Summary

No existing application code exists in the repository. Phase 1 creates the initial patterns for monorepo layout, Prisma access, shared Zod schemas, Next.js route handlers, and the Socket.io realtime server.

Executors should treat the project docs as the pattern source until code patterns exist:

- `AGENTS.md` for coding, validation, security, and testing rules.
- `docs/ARCHITECTURE.md` for repository boundaries and data flow.
- `docs/DATABASE_SCHEMA.md` for Prisma schema shape.
- `docs/USER_FLOWS.md` for route behavior and edge cases.
- `docs/DESIGN_SYSTEM.md` for UI direction.
- `.planning/phases/01-foundation-lobby/01-RESEARCH.md` for Phase 1 implementation boundaries.

## File Classification

| File or Area | Role | Existing Analog | Pattern Source |
|--------------|------|-----------------|----------------|
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` | Workspace scaffold | No analog found | `docs/ARCHITECTURE.md` §2 |
| `packages/db/prisma/schema.prisma` | Database schema | No analog found | `docs/DATABASE_SCHEMA.md` |
| `packages/db/src/index.ts` | Prisma client export | No analog found | `docs/ARCHITECTURE.md` §1-2 |
| `packages/shared/src/*.ts` | Shared validation/contracts | No analog found | `AGENTS.md`, `docs/ARCHITECTURE.md` §3.2 |
| `apps/web/app/api/**/route.ts` | Next.js API routes | No analog found | `docs/ARCHITECTURE.md` §4, `docs/USER_FLOWS.md` |
| `apps/web/app/**/page.tsx` | UI routes | No analog found | `docs/USER_FLOWS.md`, `docs/DESIGN_SYSTEM.md` |
| `apps/realtime/src/server.ts` | Realtime Socket.io entrypoint | No analog found | `docs/ARCHITECTURE.md` §3 |

## No Analog Found

Because this is the first implementation phase, every application file is a new pattern. The plan should make actions concrete enough that executors do not need to infer missing conventions.

## Shared Patterns to Establish

- API route entrypoints parse and validate every body/param using schemas from `packages/shared`.
- Database writes for related room/team/item creation happen in a Prisma transaction.
- Server code derives authority from authenticated sessions or verified room JWT claims, never from hidden UI state.
- Currency is represented as integer lakhs in schemas, database rows, API payloads, and tests.
- Socket server emits canonical lobby snapshots based on database state, not client-submitted truth.
- All packages use strict TypeScript and avoid `any`.
