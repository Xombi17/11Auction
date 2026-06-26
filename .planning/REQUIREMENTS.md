# Requirements: Bidstand

**Defined**: 2026-06-26
**Core Value**: Realtime server-authoritative auction logic updates across all tabs instantly without manual refresh.

## v1 Requirements

### Room Management (ROOM)
- [ ] **ROOM-01**: Commissioner can create room with room name, purse per team, timer duration, bid increment rules, squad size caps, role caps, and player pool.
- [ ] **ROOM-02**: User can join room by 6-character room code or shareable link.
- [ ] **ROOM-03**: Users must claim a role: Commissioner (verified by credential), Team Owner (claim franchise name + display name), or Spectator (view-only).
- [ ] **ROOM-04**: Room state transitions: `LOBBY` -> `AUCTION` -> `COMPLETED`.
- [ ] **ROOM-05**: Commissioner can pause and resume the live auction.

### Player Display & Results (PLAY)
- [ ] **PLAY-01**: Active player card displays name, role, base price, and bids on a prominent card.
- [ ] **PLAY-02**: Live bid history log displays chronological bid logs (team, amount, timestamp).
- [ ] **PLAY-03**: Results page displays squad rosters for each team, spends, remaining purses, and unsold players.

### Bidding & Timers (BID)
- [ ] **BID-01**: Realtime socket-based bid validation (minimum increment, team purse check, squad caps, role caps, status checks).
- [ ] **BID-02**: Server-authoritative timer resetting countdown on valid bids.
- [ ] **BID-03**: Automatic sold/unsold outcome resolution upon timer expiry.

### Technical & Resilience (TECH)
- [ ] **TECH-01**: Persistent storage of room, team, player, bid, and state transitions to PostgreSQL.
- [ ] **TECH-02**: Automatic connection drop recovery using room-scoped JWT token sessions.

## v2 Requirements

### Social & Interactivity
- **SOC-01**: Live chat and emoji reactions within the auction room.
- **SOC-02**: Skip/withdraw voting for active players.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile responsiveness | Desktop-first focus per assignment guidelines |
| Payments / real money | Play-money only |
| Multi-auction tournaments | Out of scope for v1 |
| Public room directory | All rooms are private-by-code |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01 | Phase 1 | Pending |
| ROOM-02 | Phase 1 | Pending |
| ROOM-03 | Phase 1 | Pending |
| ROOM-04 | Phase 2 | Pending |
| ROOM-05 | Phase 2 | Pending |
| PLAY-01 | Phase 2 | Pending |
| PLAY-02 | Phase 2 | Pending |
| PLAY-03 | Phase 3 | Pending |
| BID-01 | Phase 2 | Pending |
| BID-02 | Phase 2 | Pending |
| BID-03 | Phase 2 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 after initial definition*
