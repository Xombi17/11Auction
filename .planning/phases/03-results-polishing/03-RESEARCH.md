# Phase 3 Research: Results & Polishing

## 1. Requirements Reference
- **PLAY-03**: Completed auction redirects all users to a results page.
- **Results View**: Grid of team cards, squad lists with prices paid, remaining purse, cap filling bar, unsold list.
- **Resilience**: Handle early visits to results page when auction is still finishing.

## 2. API Endpoints
We will implement GET `/api/rooms/[code]/results` in Next.js backend.
This endpoint will query:
1. Room details.
2. Teams associated with the room, including won players (`Item` relation) and owner participants.
3. Unsold items associated with the room.

## 3. UI/UX & Design Tokens
Following `docs/DESIGN_SYSTEM.md`:
- Dark base page background (`#0B0F17`), surface panels (`#131826`).
- Spent budget visualization bars.
- Monospace font for price tags (e.g. `₹23.50 Cr`).
- "Unsold" players list showing base price.
