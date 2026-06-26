# Bidstand — Product Requirements Document

> Implements **Option 3: Mini Realtime Auction Room** from the take-home assignment.
> This document is the seed spec — paste it into `/gsd-new-project` or hand it to whatever
> AI coding tool you're driving.

## 0. One-liner

A realtime auction room where a **Commissioner** runs a live player auction and **Team
Owners** bid against each other, under a fixed budget, for a fixed pool of players —
until every player is sold or marked unsold.

## 1. Chosen Domain & Core Assumption

The brief explicitly references `iplauction` as the spiritual model. We are building a
**cricket fantasy franchise player auction** (IPL-style):

- Items being auctioned = **Players** (name, role/category, base price, optional photo/stats)
- Bidders = **Team Owners**, each representing a **Franchise** with a fixed **Purse**
  (budget) and a squad with a max size + role quotas

This is the **stated assumption** the brief asks for. The schema is written generically
(`Item`, not `CricketPlayer`) so the same app could be relabeled for sneakers, art, or
domain names with no schema change — only seed data and copy would change.

Currency is stored as an **integer in Lakhs** (₹1,00,000 = 1 unit; ₹1 Crore = 100 units)
to avoid floating-point bugs. Display formatting (₹X.XX Cr) happens only in the UI layer.

## 2. Roles

| Role | Description | Identity |
|---|---|---|
| **Commissioner** (Admin) | Creates rooms, defines the player pool & team purses, starts/pauses/resumes/ends the auction, can force-resolve a stuck item | Real account — email + password |
| **Team Owner** (Participant) | Claims one team in a room, bids on the currently active player | Room-scoped session — display name + room code, no account needed |
| **Spectator** | Joins to watch only, no bidding rights | Room-scoped session, no team claim |

Why no account for Team Owners: friction-free joining is core to the "feels live" goal —
nobody should have to sign up mid-auction to bid. The room-scoped session still
satisfies the "auth or session identity" requirement, and it's the realistic UX pattern
for this kind of room (Kahoot/Jackbox-style join, not a SaaS login).

## 3. Goals

- The auction **must feel live**: bids, the current player, the timer, and presence all
  update across every open browser tab with no manual refresh.
- The auction logic (timer expiry, resolution, validation) is **server-authoritative**.
  No client ever decides an outcome; it only ever proposes a bid and renders state the
  server pushes back.
- The product works end-to-end for a full auction with zero developer hand-holding:
  create room → add players & teams → share code → run auction → see results.

## 4. Non-Goals (v1)

- Mobile responsiveness (assignment explicitly says desktop-only is fine).
- Payments / real money — purse is play-money only.
- Multi-auction tournaments, trade windows, retained players from "last season."
- A public room directory — all rooms are private-by-code by design.

## 5. Core Features (from the assignment, mapped to this product)

| Brief requirement | Implementation |
|---|---|
| Create auction room | Commissioner sets name, purse per team, default players, increment rule, timer length |
| Join room by code/link | 6-character room code + shareable `/join/[code]` link |
| Admin and participant roles | Commissioner / Team Owner / Spectator (see §2) |
| Item/player list | Player pool with name, role, base price, photo (optional), status |
| Start auction | Commissioner action, moves room `LOBBY → AUCTION` |
| Current item/player display | Large "on the block" card, visible to everyone in the room |
| Countdown timer | Server-owned absolute `timerEndsAt`; resets on every valid new bid |
| Realtime bidding | Socket-based; server validates and broadcasts every accepted bid |
| Bid history | Per-player live list: team, amount, timestamp |
| Sold/unsold outcome | Timer expiry with no bid → `UNSOLD`; expiry with a leading bid → `SOLD` |
| Final results page | Per-team squad, total spend, purse remaining; full unsold list |
| Basic room state persistence | Every state transition is written to Postgres, not just kept in memory |

## 6. Optional Features Included in v1

Chosen because they reinforce the "feels like a real auction" goal and are cheap once
sockets + Postgres exist:

- **Team/squad budgets** — purse decreases as a team wins players; can't bid past remaining purse.
- **Maximum players per team** — squad size cap (default 18, configurable).
- **Role/category caps** — min/max per role (e.g. Batsman/Bowler/All-rounder/Wicketkeeper), configurable per room.
- **Auction pause/resume** — Commissioner can pause mid-item; timer freezes and resumes from remaining time.
- **Presence indicators** — who's currently connected in the room (small thing, ships almost free once sockets exist).
- **Spectator mode** — join without claiming a team.

**Explicitly deferred** to "Future Improvements" (see Known Limitations in README):
skip/withdraw voting, chat/reactions, public room directory.

## 7. Auction State Machine

```
LOBBY ──(commissioner starts)──▶ AUCTION ──(all items resolved)──▶ COMPLETED
                                    │  ▲
                          (pause)   ▼  │ (resume)
                                  PAUSED
```

Within `AUCTION`, each player goes through its own micro state machine:

```
PENDING ──(comes up next)──▶ IN_AUCTION ──(timer expiry, no bid)────▶ UNSOLD
                                  │
                                  └────(timer expiry, has leading bid)──▶ SOLD
```

Rules:
- Exactly one item is `IN_AUCTION` at a time.
- A bid is only accepted if: item is `IN_AUCTION`, room is `AUCTION` (not `PAUSED`),
  bidder's team has enough remaining purse, bid ≥ current price + required increment,
  and the bid arrives before `timerEndsAt`.
- Every accepted bid **resets** `timerEndsAt` to `now + timerDuration` (classic
  "going once, going twice" pattern). There's a configurable max reset count per item
  to guarantee items can't be bid-warred forever (default: unlimited, override-able).
- Commissioner can **force-resolve** an item (mark sold to current high bid, or unsold)
  if something gets stuck — an escape hatch, not the happy path.

## 8. Functional Requirements by Screen

**Auth / Landing** — Commissioner sign up / log in. Loading state on submit, inline
validation errors, redirect to dashboard on success.

**Commissioner Dashboard** — list of rooms created, "Create Room" CTA, room status
badges (Lobby/Live/Completed).

**Create Room Wizard** — room name, default purse per team, number of teams, timer
duration, increment rule (flat or tiered — see Architecture doc), squad size cap, role
caps, then add players (manual entry or paste/import a list — CSV minimum). Empty state
before any players are added; can't start auction with zero players or zero teams.

**Lobby** — room code + shareable link prominently displayed, live list of joined teams
(name, owner display name, connected/disconnected dot), Commissioner-only "Start
Auction" button (disabled until ≥1 team has joined).

**Auction Room (the core screen)** — current player card (name, role, base price, photo
placeholder if none), current highest bid + leading team, countdown ring/bar, bid
button(s) per the increment rule, live bid history feed, all teams' purse-remaining +
squad-fill bar, Commissioner-only pause/resume/force-resolve controls.

**Results Page** — per-team final squad with prices paid, purse spent vs. remaining,
full list of unsold players, shareable/printable summary. Updates live if viewed while
the auction is still finishing the last item.

Every screen needs explicit **loading**, **empty**, and **error** states — this is a
named evaluation criterion, not a nice-to-have.

## 9. Non-Functional Requirements

- **Realtime correctness across tabs**: open the same room in 3+ browser tabs/profiles,
  bid from each, and all tabs must converge to the same state within ~1 round trip.
- **Concurrency**: two teams bidding within the same animation frame must resolve
  deterministically (server processes one room's events sequentially — see Architecture
  doc §Concurrency).
- **Reconnect resilience**: refreshing or losing connection mid-auction must not lose a
  Team Owner's identity or their team's purse state — server is the source of truth, not
  the browser tab.
- **Crash recovery**: timer state is derived from a persisted absolute timestamp, not an
  in-memory countdown, so a server restart mid-auction can recover or at minimum fail
  gracefully into `PAUSED` rather than corrupting state.

## 10. Success Criteria / Definition of Done

- A non-technical person can create a room, get 2+ friends to join on their own laptops,
  run a full auction of ~10 players, and reach a results page — without you narrating
  every click.
- Killing and refreshing a Team Owner's tab mid-bid does not break the room for anyone
  else.
- Demo data/seed flow exists so an evaluator can see a populated room in under a minute.

## 11. Open Assumptions (restate in your repo README)

1. Domain = cricket franchise auction (IPL-style), chosen per `iplauction` reference —
   swappable by relabeling, not re-architecting.
2. Team Owners don't need persistent accounts; only Commissioners do.
3. Currency is play-money, integer-lakhs internally, ₹ Cr displayed.
4. Default purse ₹100 Cr / team, default squad size 18 — both configurable per room,
   not hardcoded business rules.
5. Bid increments follow a simple tiered table we designed for this app (see
   Architecture doc) — not a claim about real-world auction rules.
6. Desktop-only, minimum viewport ~1280px, per the assignment's explicit relaxation.
