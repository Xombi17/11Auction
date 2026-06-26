# Features Research: Bidstand

## Feature Categories

### Table Stakes (Must Have for v1)
- **Room Creation**: Commissioner sets room name, default team purse, timer duration, player pool, and bid increments.
- **Room Joining**: Frictionless join by 6-char code; Commissioner role verified by password, Team Owner by room JWT token, Spectators watch without claiming team.
- **Active Player Display**: Displays current player details, photo placeholder, base price, and bids on a prominent card.
- **Server-Authoritative Timer**: Realtime countdown that resets on each valid bid and resolves sold/unsold state on expiry.
- **Realtime Bidding**: Sockets handle placing, validating, and broadcasting bids.
- **Bid History Feed**: Shows chronological logs of active player's bids.
- **Results Page**: Shows final squad lineups, spent purses, remaining budgets, and unsold players list.
- **Basic Persistence**: All state transitions written directly to PostgreSQL.

### Differentiators (Optional but Included in v1)
- **Purse Constraints**: Purse decreases when player is sold; no bidding beyond remaining budget.
- **Squad Size Cap**: Maximum squad size limit per franchise (default 18).
- **Role/Category Caps**: Max/min constraints per player role (e.g. Batsman, Bowler, Wicketkeeper).
- **Pause & Resume**: Commissioner can pause/resume timer mid-player.
- **Presence Indicators**: Visual list of joined and connected users.

### Out of Scope (v1)
- Mobile responsiveness (desktop-first)
- Multi-auction tournaments / Trade windows
- Public room directory
- Real-time chat & reactions
