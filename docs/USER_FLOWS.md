# Bidstand — User Flows

## 1. Commissioner: Sign Up / Log In

1. Lands on `/`, clicks "Create an account."
2. Enters email, password, name → submit shows inline loading on the button.
3. Success → redirected to `/dashboard`. Failure (duplicate email, weak password) →
   inline field error, form stays filled.
4. Returning Commissioner: `/login` → same pattern, generic "invalid credentials"
   message (don't leak which field was wrong).

## 2. Commissioner: Create Room

1. From `/dashboard`, click "New Room."
2. Step 1 — Room basics: name, default purse per team (lakhs, displayed as ₹X Cr),
   squad size cap, timer duration, increment rule (pick a preset or customize tiers).
3. Step 2 — Teams: add N teams by name (owners join and claim one later — Commissioner
   doesn't assign owners up front).
4. Step 3 — Players: add manually (name, category, base price) or paste a CSV. Empty
   state blocks "Create" until at least one player and one team exist.
5. Submit → room created with status `LOBBY`, redirected to `/room/[code]/lobby`
   (Commissioner view).

**Edge cases:** duplicate team names within a room → inline validation. CSV paste with
a malformed row → show which row failed, don't silently drop it.

## 3. Sharing & Joining

1. Lobby screen shows the room code in large type plus a copyable join link
   `https://app/join/[code]`.
2. A new visitor hits `/join/[code]` → prompted for a display name and a choice: "Own a
   team" (pick from unclaimed teams) or "Spectate."
3. On submit, the web app creates a `Participant` row, issues the room-scoped JWT
   (httpOnly cookie) + sets a `localStorage` anonId, then redirects into
   `/room/[code]/lobby`.
4. **Invalid code** → friendly "room not found" state with a way to re-enter a code, not
   a 404 page.
5. **Room already past `LOBBY`** → late joiners can still join as a Spectator (or as a
   Team Owner if their team is unclaimed and the Commissioner allows late joins —
   default: allowed, since teams already exist before auction starts in practice this
   mostly matters for reconnects).
6. **All teams claimed** → "own a team" option is disabled in the picker, spectating
   still available.

## 4. Lobby (pre-auction)

- Everyone in the room sees: room name, code/link, live roster of teams (claimed/open),
  participant list with presence dots.
- Commissioner sees a "Start Auction" button — disabled with a tooltip if fewer than 2
  teams have an owner, or zero players exist (shouldn't happen given creation flow, but
  defend anyway).
- Team Owners/Spectators see a waiting state — "Waiting for the Commissioner to start…" —
  not a static dead screen; presence updates should visibly move.

## 5. Auction Loop (per item)

1. Commissioner clicks "Start Auction" → room moves to `AUCTION`, first `PENDING` item
   (by `auctionOrder`) becomes `IN_AUCTION`, `timerEndsAt` set, broadcast to everyone.
2. Everyone sees the current player card, base price, countdown.
3. A Team Owner clicks a bid amount (next valid increment is pre-computed and shown as
   the button label, e.g. "Bid ₹1.10 Cr") → optimistic UI shows "bidding…" briefly,
   then either confirms (server accepted) or reverts with a toast (server rejected,
   reason shown: "purse exceeded," "too slow — price moved," "squad full for this
   role").
4. Every accepted bid: current price + leading team update for *everyone*, bid history
   feed prepends the new bid, timer resets to full duration.
5. Timer hits zero with no further bids since the last reset:
   - If there's a leading bid → item resolves `SOLD`, that team's purse decreases, squad
     count increments, a "SOLD to [Team] for ₹X Cr" banner shows for ~3s.
   - If there's no bid at all → item resolves `UNSOLD`, a neutral banner shows.
6. After the resolution banner, the next `PENDING` item loads automatically (short
   pause, e.g. 3–5s, so people can see the outcome). Loop continues until no `PENDING`
   items remain.
7. Room moves to `COMPLETED`, everyone is redirected (or shown a link) to the results
   page.

## 6. Pause / Resume

1. Commissioner clicks "Pause" mid-item → room status `PAUSED`, timer freezes (server
   stores remaining time, not just stops the clock), all bid buttons disabled for
   everyone, a "Paused by Commissioner" banner shows.
2. Commissioner clicks "Resume" → `timerEndsAt` recalculated from the frozen remaining
   time, room back to `AUCTION`, bidding re-enabled.

## 7. Disconnect & Reconnect

1. A Team Owner's laptop sleeps mid-auction. Their socket disconnects → server marks
   `Participant.connected = false`, broadcasts `presence:update` (their dot goes grey for
   everyone else). Their purse/team state is untouched.
2. They reopen the tab. `localStorage` anonId is still present → web app re-issues the
   same room-scoped JWT for the same `Participant` row, socket reconnects, server
   replays the current `room:state` snapshot including the live timer (`timerEndsAt`).
   They're back in exactly where they left off, with no duplicate team or lost purse.
3. If `localStorage` was cleared (different browser/incognito) → treated as a brand-new
   join; if their original team is still unclaimed they can re-claim it, otherwise they
   join as a Spectator.

## 8. Commissioner Escape Hatches

- **Force-resolve**: if an item seems stuck (e.g. a bug, or everyone agrees to move on),
  Commissioner can force `SOLD` (to current leader) or `UNSOLD` without waiting for the
  timer. Logged distinctly in bid history as a manual action.
- **End auction early**: remaining `PENDING` items are bulk-marked `UNSOLD`, room moves
  straight to `COMPLETED`.

## 9. Results Page

- `/room/[code]/results` — accessible to everyone who was in the room (and the
  Commissioner from their dashboard afterward).
- Per-team card: squad list with price paid per player, total spent, purse remaining,
  squad-fill vs. cap.
- A separate "Unsold" list.
- If accessed while the last item is *still* resolving (race between someone clicking a
  shared link and the auction actually finishing), show a live "Auction wrapping up…"
  state that flips to full results the moment `auction:completed` fires — never a blank
  or broken page.

## 10. Error & Empty States Checklist

| Screen | Empty state | Error state |
|---|---|---|
| Dashboard | "No rooms yet — create your first one" | Failed fetch → retry button |
| Create Room | Block submit, inline "add at least one player/team" | Validation errors per field |
| Lobby | "Waiting for teams to join" | Socket disconnected → reconnecting banner |
| Auction Room | N/A (always has a current item once started) | Bid rejected → toast with reason; socket down → full reconnecting overlay, no stale bidding allowed |
| Results | "Auction not finished yet" if hit early | Failed fetch → retry |
