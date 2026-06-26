# Bidstand — Database Schema

Prisma-style schema (adapt directly into `packages/db/schema.prisma`). All currency
fields are integers in **Lakhs** (see PRD §1).

```prisma
enum RoomStatus {
  LOBBY
  AUCTION
  PAUSED
  COMPLETED
}

enum ItemStatus {
  PENDING
  IN_AUCTION
  SOLD
  UNSOLD
}

enum ParticipantRole {
  COMMISSIONER
  TEAM_OWNER
  SPECTATOR
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  rooms        Room[]
}

model Room {
  id                String      @id @default(cuid())
  code              String      @unique          // 6-char shareable join code
  name              String
  status            RoomStatus  @default(LOBBY)
  commissionerId    String
  commissioner      User        @relation(fields: [commissionerId], references: [id])

  // configurable rules
  defaultPurse      Int                            // lakhs, applied to teams on creation
  squadSizeCap      Int         @default(18)
  roleCaps          Json?                          // e.g. { "Batsman": {min:4,max:8}, ... }
  timerSeconds      Int         @default(15)
  incrementRule     Json                           // tiered increment table, see below

  currentItemId     String?     @unique
  currentItem       Item?       @relation("CurrentItem", fields: [currentItemId], references: [id])
  timerEndsAt       DateTime?                       // absolute timestamp, server-authoritative

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  teams             Team[]
  items             Item[]
  participants      Participant[]
}

model Team {
  id              String   @id @default(cuid())
  roomId          String
  room            Room     @relation(fields: [roomId], references: [id])
  name            String
  purseTotal      Int                     // lakhs
  purseRemaining  Int                     // lakhs, decremented as players are won
  ownerParticipantId String? @unique
  ownerParticipant   Participant? @relation("TeamOwner", fields: [ownerParticipantId], references: [id])

  players         Item[]   @relation("WonBy")
  bids            Bid[]

  @@index([roomId])
}

model Item {
  id            String      @id @default(cuid())
  roomId        String
  room          Room        @relation(fields: [roomId], references: [id])
  name          String
  category      String                       // e.g. "Batsman", "Bowler", "All-rounder", "Wicketkeeper"
  basePrice     Int                          // lakhs
  imageUrl      String?
  status        ItemStatus  @default(PENDING)
  auctionOrder  Int                          // sequence within the room

  soldToTeamId  String?
  soldToTeam    Team?       @relation("WonBy", fields: [soldToTeamId], references: [id])
  soldPrice     Int?                          // lakhs

  currentForRoom Room?      @relation("CurrentItem")

  bids          Bid[]

  @@index([roomId, status])
  @@unique([roomId, auctionOrder])
}

model Bid {
  id         String   @id @default(cuid())
  roomId     String
  itemId     String
  item       Item     @relation(fields: [itemId], references: [id])
  teamId     String
  team       Team     @relation(fields: [teamId], references: [id])
  amount     Int                              // lakhs
  createdAt  DateTime @default(now())

  @@index([itemId, createdAt])
}

model Participant {
  id            String          @id @default(cuid())
  roomId        String
  room          Room            @relation(fields: [roomId], references: [id])
  displayName   String
  role          ParticipantRole
  anonId        String          // matches localStorage value, used to re-claim identity on rejoin
  connected     Boolean         @default(true)
  lastSeenAt    DateTime        @default(now())

  team          Team?           @relation("TeamOwner")

  @@unique([roomId, anonId])
  @@index([roomId])
}
```

## Notes & Rationale

- **`Room.timerEndsAt` lives on the Room, not in memory only** — this is what lets the
  realtime server recover (or at least fail gracefully) after a restart, and what lets a
  newly-reconnecting client compute its own correct countdown without asking "how much
  time is left?" as a special-cased query.
- **`Participant.anonId`** is the bridge between a browser's `localStorage` value and a
  durable DB row, so refreshing a tab mid-auction reattaches to the same team instead of
  minting a duplicate participant.
- **`incrementRule` as JSON** rather than hardcoded business logic — keeps the bidding
  increment table a per-room configuration, not a constant, which is both more honest
  (we made this rule up for the app, see PRD §11) and easier to demo with different
  presets.
- **Indexes** on `(roomId, status)` for items and `(itemId, createdAt)` for bids are the
  two queries you'll run constantly (current pending items, bid history for an item) —
  worth having from day one rather than retrofitting under time pressure.
- Soft-delete is intentionally **not** included — rooms are cheap, demo data is
  ephemeral, and an evaluator resetting state is a feature, not a risk, at this scope.
