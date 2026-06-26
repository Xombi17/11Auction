# Bidstand — Build Roadmap

A suggested phase breakdown, sized to slot directly into GSD's loop:
**Discuss → Plan → Execute → Verify → Ship**, one phase at a time.

After `/gsd-new-project` (seeded with `docs/PRD.md`), GSD will generate its own roadmap
into `.planning/` — treat this file as your own sanity-check / starting point, not a
replacement for what GSD produces. If they disagree, GSD's questions during
`/gsd-new-project` and `/gsd-discuss-phase` are the place to reconcile it, not this file.

## Phase 0 — Project Scaffold
Monorepo structure (`apps/web`, `apps/realtime`, `packages/db`, `packages/shared`),
Postgres provisioned (Neon), Prisma schema from `docs/DATABASE_SCHEMA.md` migrated,
CLAUDE.md/AGENTS.md committed, CI lint/typecheck running on push.

## Phase 1 — Auth & Room CRUD
Commissioner signup/login (Auth.js credentials), Create Room wizard (basics → teams →
players), Dashboard listing a Commissioner's rooms. No realtime yet — everything in this
phase is plain request/response.

## Phase 2 — Join Flow & Lobby
`/join/[code]` flow, Participant creation, room-scoped JWT issuance, Lobby screen with
live-ish polling is acceptable as a stub here if sockets aren't wired yet — swap to true
realtime in Phase 3.

## Phase 3 — Realtime Server Skeleton
Stand up `apps/realtime` (Express + Socket.io), socket auth handshake using the
room-scoped JWT, room join/leave, presence broadcast. No auction logic yet — prove
connect/disconnect/reconnect works first.

## Phase 4 — Core Auction Engine (the heart — consider splitting into 4a/4b)
- **4a — Bid placement & validation**: `bid:place` handler, purse/role-cap/increment
  validation, `bid:accepted` / `bid:rejected`, bid persisted to Postgres.
- **4b — Timer engine & resolution**: server-owned `timerEndsAt`, reset-on-bid, expiry
  resolution to SOLD/UNSOLD, auto-advance to next `PENDING` item.

## Phase 5 — Auction Room UI
Current player card, countdown ring, bid buttons wired to the socket contract, live bid
history feed, team purse strip — this is where Design System §3 (Auction Room) gets
built for real.

## Phase 6 — Resilience
Pause/resume, force-resolve, disconnect/reconnect flows from User Flows §6–7, the
reconnecting banner and full state-resync-on-reconnect.

## Phase 7 — Results Page
Per-team squad summary, unsold list, the "still wrapping up" live state for early
visitors.

## Phase 8 — Polish Pass
Loading/empty/error states across every screen (User Flows §10 checklist), the
SOLD/UNSOLD resolution animation, copy pass.

## Phase 9 — Seed Data, Deployment & Submission Packaging
Demo seed script (a pre-populated room with real-feeling players so an evaluator sees a
live room in under a minute), deploy web → Vercel, realtime → Railway/Render, DB → Neon,
`.env.example` finalized, README filled in per the assignment template, AI transcripts
exported into `ai-transcripts/`.

---

## Using this with GSD

```bash
# one-time setup (use the audited fork, not the original — see security note below)
npx @opengsd/get-shit-done-redux@latest --claude --local

# inside Claude Code
/gsd-new-project        # paste in docs/PRD.md when it asks what you're building
/gsd-discuss-phase 1     # for each phase above — point it at the relevant section(s)
/gsd-plan-phase 1        # of ARCHITECTURE.md / DATABASE_SCHEMA.md / USER_FLOWS.md /
/gsd-execute-phase 1     # DESIGN_SYSTEM.md as needed during discuss
/gsd-verify-work 1
/gsd-ship 1
# repeat for phase 2, 3, ...
```

**Security note:** the original `get-shit-done-cc` / `gsd-build/get-shit-done` package
has an unreachable maintainer and a token tied to a rug-pull as of this writing. Use the
community-audited fork, `@opengsd/get-shit-done-redux`, instead. Re-check
`github.com/open-gsd/get-shit-done-redux` for the current state before you install,
since this kind of thing moves fast.

GSD's own `/gsd-discuss-phase` will ask you implementation questions per phase — that's
the point of the tool, don't pre-answer everything in these docs. These docs exist so
you (and GSD) aren't starting from a blank page; let the discuss step surface the gaps.
