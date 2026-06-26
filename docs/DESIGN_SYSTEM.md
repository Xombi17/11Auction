# Bidstand — Design System

Desktop-only per the assignment's explicit relaxation. Design for a **minimum 1280px**
viewport; don't burn time on responsive breakpoints.

## 1. Direction

A live auction needs to *feel* live — energy, tension, a clear "moment" when something
sells. Lean into a **stadium scoreboard / broadcast graphics** aesthetic rather than a
generic SaaS dashboard:

- Dark base (near-black navy/charcoal), not pure black — gives accent colors room to pop.
- One confident accent color for "active/live" state (amber/gold reads as "auction" —
  think hammer-falling energy), green for SOLD, a muted red/slate for UNSOLD (not alarm
  red — unsold isn't an error, it's a normal outcome).
- Tabular/monospace numerals for currency and the timer specifically — anything that
  changes rapidly (price ticking up, countdown) should not visually reflow as digit
  widths change.
- A bold, condensed display weight for the "on the block" player name — this is the one
  moment the design should shout.

## 2. Palette (CSS variables)

```css
--bg-base: #0B0F17;        /* page background */
--bg-surface: #131826;     /* cards, panels */
--bg-surface-raised: #1B2233;
--border-subtle: #262E40;

--text-primary: #F4F6FA;
--text-secondary: #9AA4B8;
--text-muted: #5C667A;

--accent-live: #F5B83D;    /* active auction / "on the block" */
--accent-sold: #3DDC84;
--accent-unsold: #8893A6;  /* deliberately muted, not red */
--accent-danger: #E3564B;  /* real errors only */

--font-display: 'Archivo', sans-serif;     /* condensed, bold — player name */
--font-body: 'Inter', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;   /* currency, timer */
```

(Swap exact font names for whatever's available — the point is: one condensed display
face, one clean body face, one tabular mono face for numbers.)

## 3. Pages & Layout

### Landing / Auth
Centered card, minimal — this page's only job is to get a Commissioner to a dashboard
fast. No need for marketing flourish.

### Commissioner Dashboard
Left-aligned list of room cards (name, status badge, created date) + a prominent
"New Room" button top-right. Empty state is a single centered illustration-less prompt,
not a sparse table.

### Create Room Wizard
Three-step horizontal stepper at the top (Basics → Teams → Players). Keep all fields on
one scroll per step rather than nested modals — Commissioners will be doing this once
per auction, optimize for "fill it in fast," not for visual delight.

### Lobby
Two-column: left = room code/link in a large card with a copy button; right = live
roster (teams claimed/unclaimed, participant presence list below). Commissioner's
"Start Auction" CTA is fixed bottom-right, large, can't be missed.

### Auction Room (the centerpiece screen)
This is the screen that needs to feel good. Suggested layout, three columns:

```
┌───────────────────────────────────────────────────────────┐
│  [Team purse strip — all teams, remaining purse, fill bar] │
├───────────────────────┬───────────────────────────────────┤
│                       │  Bid history (live feed,           │
│   CURRENT PLAYER      │  newest on top, team + amount +    │
│   CARD                │  relative time)                    │
│   - name (display     │                                     │
│     font, large)      │                                     │
│   - role tag           │                                     │
│   - base price         │                                     │
│   - current price      │                                     │
│     (mono, large)      │                                     │
│   - leading team        │                                     │
│   - countdown ring      │                                     │
│   - bid button(s)       │                                     │
├───────────────────────┴───────────────────────────────────┤
│  [Commissioner controls — pause/resume/force-resolve]      │
│  (hidden entirely for non-admin roles, not just disabled)   │
└───────────────────────────────────────────────────────────┘
```

- **Countdown**: an actual ring or bar, not just a number — peripheral-vision-readable
  urgency matters more here than precision.
- **SOLD/UNSOLD moment**: a short full-card overlay transition (color wash + the
  resolution amount in large mono type) before sliding to the next player — this is the
  single highest-leverage animation in the whole app for "feeling live."
- **Bid buttons**: show the actual next valid amount, not a generic "+" — e.g. one big
  primary button "Bid ₹1.10 Cr," not a stepper a user has to interpret.

### Results Page
Grid of team cards (squad list + spend bar), an "Unsold" section below, a subtle
celebratory treatment for the page itself (not per-team — keep it neutral across teams,
this isn't declaring a "winner").

## 4. Component Inventory

- `RoomCodeBadge` — large monospace code + copy button
- `CountdownRing` — SVG ring, props: `endsAt`, `durationSeconds`
- `PlayerCard` (current item) — has explicit loading skeleton variant for the moment
  between items
- `BidHistoryFeed` — virtualized if it gets long, newest-first
- `TeamPurseStrip` — horizontal scroller of compact team chips, fill bar per team
- `ResolutionOverlay` — SOLD/UNSOLD transition
- `PresenceDot` — connected/disconnected/idle states
- `ToastStack` — for bid-rejected reasons, connection issues
- `EmptyState` — reusable, icon + message + optional action, used across dashboard/
  lobby/results

## 5. States Checklist (apply to every data-driven view)

- **Loading**: skeletons that match real layout shape, never a bare spinner on a screen
  that has structure (auction room, results).
- **Empty**: a sentence + an action, never a blank white/dark void.
- **Error**: specific enough to act on ("Couldn't reach the auction server — retrying…"
  not "Something went wrong"), with a retry action where one makes sense.
- **Disconnected** (auction-room specific): a non-blocking top banner, bidding controls
  disabled while it's shown, auto-clears on reconnect.
