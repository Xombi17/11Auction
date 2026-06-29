# Phase 4 Research Notes

## Demo Room Seeder
- Reuse existing room creation logic from `/api/rooms` POST
- Preset data: 8 IPL teams, 12 preset players from CreateRoomPage
- Must run in transaction (room + teams + players)
- Return room code for immediate redirect

## Audio
- Web Audio API requires user interaction before playing
- Solution: Initialize AudioContext on first user click (any button)
- Use tiny base64-encoded WAV files or fetch from /public/sounds/
- Keep files < 5KB each for instant playback

## Toast System
- Lightweight: ~2KB gzipped if using sonner or custom
- Custom implementation: React Context + portal to body
- Features: success/error/info, action button, auto-dismiss (4s), stack limit (5)

## CSV Export
- Data already available in results page via API
- Format: Team,Player,Category,Sold Price (Lakhs),Purse Remaining (Lakhs)
- Unsold sheet: Player,Category,Base Price (Lakhs)
- Use Blob + download attribute

## Keyboard Shortcuts
- Space: preventDefault, check canPlaceBid, emit bid:place
- P: preventDefault, check role === COMMISSIONER, emit room:pause/resume
- Only active when auction page has focus (no modifier keys)

## Spectator Count
- Already in participants array from room:state
- Count: participants.filter(p => p.role === 'SPECTATOR').length
- Plus: Team Owners who are disconnected (offline but claimed)
- Update in real-time via presence:update / room:state