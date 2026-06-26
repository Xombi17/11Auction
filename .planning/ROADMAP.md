# Roadmap: Bidstand

## Overview

Bidstand is built iteratively in 3 key phases. We establish the database models and room joining capabilities first, then layer on the realtime Socket.io authoritative bidding engine, and conclude with the squad results page and manual multi-browser session validation.

## Phases

- [ ] **Phase 1: Foundation & Lobby** - Database setup, REST APIs for room creation, and lobby joining
- [ ] **Phase 2: Live Realtime Auction Room** - Authoritative bidding, timers, socket server, and state transitions
- [ ] **Phase 3: Results & Polishing** - Squad results dashboard, stats, and E2E multi-session testing

## Phase Details

### Phase 1: Foundation & Lobby
**Goal**: Database setup, REST APIs for room creation, and lobby joining
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: ROOM-01, ROOM-02, ROOM-03, TECH-01
**Success Criteria**:
  1. Commissioner can configure and create a room, saving it to PostgreSQL.
  2. Users can join a room via a 6-character code and claim a role (Commissioner, Team Owner, Spectator).
  3. Joined teams are listed in real-time in the room lobby.
**Plans**: 1 plan

Plans:
- [ ] 01-01: Database setup, API routes for room/lobby setup, and basic JWT auth.

### Phase 2: Live Realtime Auction Room
**Goal**: Authoritative bidding, timers, socket server, and state transitions
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: ROOM-04, ROOM-05, PLAY-01, PLAY-02, BID-01, BID-02, BID-03, TECH-02
**Success Criteria**:
  1. Active player card displays details, and high-bid updates broadcast instantly to all tabs.
  2. Bidding triggers a countdown reset on the server.
  3. Bids are rejected if they violate purse, increment, or role caps.
  4. Timer expiry auto-resolves to SOLD or UNSOLD.
  5. Commissioner can pause and resume the auction.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Sockets integration, live bidding state machine, countdown timers, and persistence logic.

### Phase 3: Results & Polishing
**Goal**: Squad results dashboard, stats, and E2E multi-session testing
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: PLAY-03
**Success Criteria**:
  1. Completed auction redirects all users to a results page.
  2. Results page lists detailed team squads, spends, and unsold players.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Results summary view, final styling polish, and multi-browser manual verification.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Lobby | 0/1 | Not started | - |
| 2. Live Realtime Auction Room | 0/1 | Not started | - |
| 3. Results & Polishing | 0/1 | Not started | - |
