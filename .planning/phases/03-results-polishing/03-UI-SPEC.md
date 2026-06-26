# Phase 3 UI Spec: Results Summary Page

## 1. Page Details & Theme
- **Path**: `/room/[code]/results`
- **Visuals**: Modern Dark Mode, gold/amber highlights for the title card.
- **Font Stack**: Inter, Archivo (display headings), IBM Plex Mono (for prices, budgets, and percentages).

## 2. Layout Structure
- **Header**:
  - Room Title (large bold display)
  - Completion Status Badge (solid green border/background, bold text)
- **Teams Grid**:
  - 3-column responsive grid of Cards.
  - Card Header: Team Name + Owner name badge.
  - Purse indicator: Progress bar (spent vs remaining purse) + numeric values in lakhs/crores.
  - Squad indicator: Cap bar (number of players vs max squad limit).
  - Squad List: Scrolling list of players showing Name, Category, and price paid (e.g. `₹12.00 Cr`).
- **Unsold Card**:
  - Right-aligned or full-width section listing all unsold players in a compact flex wrap with their base prices.

## 3. Realtime Transition State
- If `Room.status` is not `COMPLETED`, render a Glassmorphic overlay stating: "Auction is currently wrapping up... Results will display automatically once completed."
- Re-check status on socket updates.
