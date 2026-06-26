# Phase 2: Live Realtime Auction Room - UI Design Contract

**Phase:** 2 - Live Realtime Auction Room
**Theme:** Stadium Scoreboard / Broadcast Graphics

## Layout Structure

The Live Auction screen (`/room/[code]`) is desktop-first (min-width: 1280px) and structured into three primary layout zones:

1. **Top Zone: Team Purse Strip**
   - Horizontal row showing all teams in the room.
   - For each team: displays Team Name, owner name, remaining purse (e.g. `₹85.50 Cr` / `₹100.00 Cr`), and a progress bar representing the percentage of budget remaining.
   
2. **Main Content Zone (Two Columns)**
   - **Left Column: Current Player Card & Bidding Controls**
     - Renders details of the player currently up for auction (`IN_AUCTION`).
     - Display name in large, bold font (`--font-display`).
     - Category/role tag (e.g. `Batsman`, `Bowler`, `All-rounder`, `Wicketkeeper`).
     - Base price and current highest bid (with leading team name) in large monospace font (`--font-mono`).
     - Countdown ring or bar showing seconds remaining (derived from `timerEndsAt`).
     - Bidding buttons:
       - **Primary Bid Button**: Shows the exact amount of the next valid bid (e.g. `Bid ₹1.10 Cr` based on the active increment rule).
       - Disabled if the team owner doesn't have enough purse, has filled their squad size cap, or has filled their category cap.
   - **Right Column: Live Bid History Feed**
     - Chronological list of bids placed on the current player (newest first).
     - Each entry shows: team owner name, bid amount, and a relative timestamp.

3. **Bottom Zone: Commissioner Control Console (Commissioner Only)**
   - Actions: `Pause Auction`, `Resume Auction`, `Force Sold`, `Force Unsold`.
   - Hidden completely from Team Owners and Spectators (not just disabled).

## Components Checklist

- [ ] **PurseProgressStrip**: Displays all teams with remaining budget indicators.
- [ ] **ActivePlayerCard**: Displays player image placeholder, name, category, and base price.
- [ ] **LiveBidFeed**: A scrolling list of real-time bids.
- [ ] **CountdownRing**: SVG-based ring showing timer status.
- [ ] **BidButton**: Action button showing the next increment bid amount.
- [ ] **ResolutionOverlay**: Screen-wide green (`SOLD`) or gray (`UNSOLD`) overlay shown briefly when an item resolves.
- [ ] **DisconnectedBanner**: Displayed at the top of the viewport if the websocket disconnects.
