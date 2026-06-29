# Bidstand

## What This Is

A realtime cricket franchise player auction room (IPL-style) where a Commissioner runs a live player auction and Team Owners bid against each other, under a fixed budget, for a fixed pool of players.

## Core Value

Realtime server-authoritative auction logic updates across all tabs instantly without manual refresh.

## Requirements

### Validated

- [x] Create auction room with configurable parameters (purse, squad cap, timer, increments, role caps, player pool) — **Phase 1**
- [x] Join room via 6-character room code or shareable link (identity as Commissioner, Team Owner, or Spectator) — **Phase 1**
- [x] Server-authoritative countdown timer resetting on valid new bids — **Phase 2**
- [x] Realtime socket-based bid propagation and verification (purse, increments, squad limits, status check) — **Phase 2**
- [x] Sold/unsold outcome resolution upon timer expiry — **Phase 2**
- [x] Room state persistence to PostgreSQL database — **Phase 1-2**
- [x] Show final results page with squad summary, spends, and remaining purses — **Phase 3**

### Active

- [ ] One-click demo room creation from landing page
- [ ] Sound notifications for bid placed, timer < 5s, SOLD/UNSOLD resolution
- [ ] Toast notifications replacing alert() for kick, disband, errors
- [ ] CSV export on results page
- [ ] Keyboard shortcuts (Space to bid, P to pause/resume)
- [ ] Spectator count badge in auction header

### Out of Scope

- Mobile responsiveness — Desktop-only is fine per brief
- Payments / Real money — Purse is play-money only
- Multi-auction tournaments, trade windows, retained players
- Public room directory — Private-by-code only

## Context

Cricket franchise player auction built with Next.js (frontend + REST-ish API), Express + Socket.io (live auction state & timers), and Prisma (PostgreSQL).

## Constraints

- **Tech Stack**: Next.js, Express, Socket.io, Prisma, Tailwind CSS, TypeScript.
- **Data type**: Currency represented as integer in Lakhs (1 Lakh = 1 unit) to avoid floating point bugs.
- **Architecture**: Realtime server is the only thing that ever decides an auction outcome.
- **AI Transcripts**: Must export conversational transcripts to `ai-transcripts/` and keep `ai-transcripts/ai-usage-summary.md` updated.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Room-scoped sessions for Team Owners | Avoid account creation friction for bidders, join with display name + room code | — Pending |
| Integer Lakhs representation | Prevent floating-point currency representation bugs | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-27 after Phase 4 planning*
