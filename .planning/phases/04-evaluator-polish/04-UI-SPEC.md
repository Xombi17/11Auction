# Phase 4 UI Spec

## Landing Page
- New button: "Try Demo Auction" (secondary style, next to "Create Room")
- Click → POST /api/demo/room → redirect to /room/{code}/lobby
- Loading state: button shows "Creating demo..." with spinner

## Auction Page - Audio
- First click anywhere → AudioContext.resume()
- Sounds:
  - `bid.mp3`: Short cash register "ching" (200ms)
  - `warning.mp3`: Double beep at 5s, 3s, 1s (distinct from bid sound)
  - `sold.mp3`: Triumphant chord (500ms)
  - `unsold.mp3`: Soft downward tone (500ms)

## Toast Notifications
- Position: top-right, stacked (newest on top)
- Types: success (green), error (red), info (blue), warning (amber)
- Auto-dismiss: 4 seconds
- Max visible: 5
- Action button support: "Undo" for kick (re-adds participant), "Dismiss"

## Results Page - CSV Export
- Button: "Export CSV" (icon: download, secondary style)
- Filename: `bidstand-results-{roomCode}-{date}.csv`
- Two sheets in one CSV (separated by blank line):
  1. SOLD PLAYERS: Team,Player,Category,Sold Price (Lakhs),Purse Remaining (Lakhs)
  2. UNSOLD PLAYERS: Player,Category,Base Price (Lakhs)

## Keyboard Shortcuts (Auction Page Only)
- `Space`: Place bid (Team Owner only, when canPlaceBid)
- `P`: Pause/Resume (Commissioner only)
- `Escape`: Close modals (Manage Users, Resolution overlay)
- Show hints: Small "Space to bid • P to pause" in bidding controls footer

## Header - Spectator Badge
- Format: `👁 {count} watching`
- Count = SPECTATOR role + disconnected TEAM_OWNER
- Live update via room:state broadcast
- Style: Small pill, amber icon, slate text, next to room status badge