# Bidstand — Realtime Auction Room

A realtime auction room for live player auctions (cricket-franchise-style/IPL-style).

## Setup & Running Locally

### 1. Install Dependencies
```bash
npx pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both `apps/web` and `apps/realtime`:
```bash
cp apps/web/.env.example apps/web/.env
cp apps/realtime/.env.example apps/realtime/.env
```
Ensure that the `ROOM_JWT_SECRET` is identical in both `.env` files.

### 3. Run Database Migrations
Make sure your PostgreSQL database is running and the `DATABASE_URL` is set correctly in both `.env` files, then run:
```bash
npx pnpm --filter @bidstand/db db:migrate
```

### 4. Run Development Servers
Start both servers simultaneously:
- **Next.js Web Server** (on `http://localhost:3000`):
  ```bash
  npx pnpm --filter @bidstand/web dev
  ```
- **Socket.io Realtime Server** (on `http://localhost:4000`):
  ```bash
  npx pnpm --filter @bidstand/realtime dev
  ```

## Quality and Testing
- Run all typechecks:
  ```bash
  npx pnpm typecheck
  ```
- Run linter checks:
  ```bash
  npx pnpm lint
  ```
