# AGENTS.md

This file follows the [agents.md](https://agents.md/) open standard — it's read by
Cursor, Codex, OpenCode, Copilot, and other AI coding tools. `CLAUDE.md` in this repo
just imports this file plus a couple of Claude Code-specific notes; don't let the two
drift out of sync. If you change a convention, change it here first.

## Project Overview

**Bidstand** — a realtime auction room for live player auctions (cricket-franchise-style
by default; see `docs/PRD.md` §1–2 for the full spec and the domain assumption). Three
roles: Commissioner (admin, real account), Team Owner (room-scoped session, bids),
Spectator (room-scoped session, view-only).

Full specs live in `docs/`:
- `docs/PRD.md` — product requirements, scope, what's in/out of v1
- `docs/ARCHITECTURE.md` — tech stack, realtime design, concurrency, deployment
- `docs/DATABASE_SCHEMA.md` — Prisma schema + rationale
- `docs/USER_FLOWS.md` — every screen's happy path + edge cases
- `docs/DESIGN_SYSTEM.md` — visual language, layout, components, states
- `docs/ROADMAP.md` — suggested phase breakdown

Read the relevant doc before touching a screen or subsystem you haven't worked on yet —
don't infer requirements from the code alone if a doc already answers the question.

## Repository Structure

```
apps/web/         # Next.js — frontend + REST-ish API routes (auth, room/player CRUD, results)
apps/realtime/    # Express + Socket.io — owns all live auction state and the timer
packages/db/      # Prisma schema + generated client, imported by both apps
packages/shared/  # Zod schemas + TS types for socket event contracts
docs/             # specs (see above)
ai-transcripts/   # AI session exports for the assignment submission
```

## Setup Commands

```bash
pnpm install
pnpm --filter @bidstand/db prisma migrate dev
pnpm --filter @bidstand/web dev          # Next.js on :3000
pnpm --filter @bidstand/realtime dev     # Socket.io server on :4000
```

Copy `.env.example` to `.env` in both `apps/web` and `apps/realtime` first —
`ROOM_JWT_SECRET` must be identical in both (see `docs/ARCHITECTURE.md` §6).

## Code Style

- TypeScript everywhere, `strict: true`, no `any` — if something is genuinely unknown
  shape, use `unknown` and narrow it.
- Validate every socket event payload and every API route body with a Zod schema from
  `packages/shared` before touching it — never trust client input, especially bid
  amounts (see Architecture doc §3.4 on concurrency — this is load-bearing, not
  defensive paranoia).
- Functional components, no class components.
- Co-locate a component's types with the component unless they're shared, in which case
  they belong in `packages/shared`.
- Prefer small, named functions over inline logic in event handlers — the auction
  resolution logic especially should be unit-testable in isolation from the socket
  transport.

## The One Rule That Matters Most

**The realtime server is the only thing that ever decides an auction outcome.** No
client-side timer, no client-side "I think I won" logic. The browser renders what the
server says happened and proposes actions (`bid:place`); it never asserts a result. If
you're ever tempted to resolve `SOLD`/`UNSOLD` or accept a bid amount on the frontend,
stop — that logic belongs in `apps/realtime`.

## Testing Instructions

- Unit test the auction resolution logic (`apps/realtime/src/rooms/`) in isolation —
  bid validation, increment calculation, timer reset, sold/unsold resolution — these are
  pure-enough functions to test without spinning up a real socket connection.
- For realtime correctness, manually test with 3+ browser sessions (different profiles,
  not just tabs, to get independent localStorage/cookies) bidding against each other —
  this is explicitly called out as an evaluation criterion, don't skip it.
- Run `pnpm typecheck` and `pnpm lint` before considering any phase done.

## Security Considerations

- Never trust a client-submitted bid amount, team id, or role claim — always re-derive
  from the verified room-scoped JWT and re-validate against the server's canonical
  state.
- `ROOM_JWT_SECRET` and `DATABASE_URL` are secrets — never commit `.env`, only
  `.env.example` with placeholder values.
- Commissioner-only actions (`auction:start/pause/resume`, force-resolve) must check the
  role embedded in the verified token server-side — a hidden button on the frontend is
  not access control.

## PR / Commit Instructions

- One phase (per `docs/ROADMAP.md`) = one logical unit of commits — keep commits small
  enough to bisect if something breaks.
- Commit messages: imperative mood, what changed and why if not obvious
  (`add server-side bid validation against team purse`, not `fix stuff`).
