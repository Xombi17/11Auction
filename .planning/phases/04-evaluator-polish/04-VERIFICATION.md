# Phase 4 Verification Checklist

## Demo Room Seeder
- [ ] POST /api/demo/room returns 200 with { ok: true, code: "ABC123" }
- [ ] Room has 8 teams, 12 players, status LOBBY
- [ ] Landing page "Try Demo" button works end-to-end
- [ ] Redirects to lobby with Commissioner token

## Audio
- [ ] First click enables audio (no autoplay policy violation)
- [ ] Bid sound plays on bid:accepted
- [ ] Warning sound plays at 5s, 3s, 1s remaining
- [ ] SOLD sound plays on resolutionOverlay SOLD
- [ ] UNSOLD sound plays on resolutionOverlay UNSOLD
- [ ] Sounds work in Chrome, Firefox, Safari

## Toast Notifications
- [ ] Kick participant → toast "Kicked {name}" with Undo action
- [ ] Disband auction → toast "Auction disbanded" 
- [ ] Bid rejected → toast "Bid rejected: {reason}" (auto-dismiss)
- [ ] Force resolve → toast "Item forced {SOLD/UNSOLD}"
- [ ] Socket error → toast "Connection lost, reconnecting..."
- [ ] No alert() calls remain in codebase

## CSV Export
- [ ] Export button visible on results page
- [ ] Download starts immediately
- [ ] CSV opens correctly in Excel/Sheets
- [ ] Data matches UI: all sold players + unsold players
- [ ] Filename includes room code and date

## Keyboard Shortcuts
- [ ] Space places bid when Team Owner, canPlaceBid=true, input not focused
- [ ] Space does nothing when Spectator/Commissioner or cannot bid
- [ ] P toggles pause/resume when Commissioner
- [ ] P does nothing for non-Commissioner
- [ ] Escape closes Manage Users modal
- [ ] Shortcut hints visible in bidding controls

## Spectator Badge
- [ ] Badge shows correct count on lobby load
- [ ] Badge updates when spectator joins/leaves
- [ ] Badge updates when Team Owner disconnects/reconnects
- [ ] Count includes offline Team Owners

## Regression
- [ ] All existing functionality works (create room, join, bid, pause, results)
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] Multi-browser test: 3 tabs (Commissioner + 2 Team Owners) → full auction