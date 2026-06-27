# Bidstand Deployment Guide

This document outlines the step-by-step instructions for deploying both the Next.js web application and the standalone realtime Socket.io server to production.

---

## 1. Architectural Overview & Constraints

As detailed in [ARCHITECTURE.md](file:///home/varad/Documents/internship-tasks/11-auction-Auction-Task/docs/ARCHITECTURE.md), the Bidstand stack is split into two deployable applications:

1. **Web App (`apps/web`)**: Next.js App Router. This handles landing pages, authentication (NextAuth), room management dashboards, results view, and database CRUD. It is **highly optimized for serverless hosting on Vercel**.
2. **Realtime Server (`apps/realtime`)**: Standalone Express + Socket.io server. It acts as the single source of truth for the auction timer, bid logic, and live room states. **It cannot be hosted on Vercel** because Vercel utilizes serverless/edge functions which terminate after requests, preventing long-running WebSocket connections and persistent in-memory countdown loops. Instead, it must be deployed on a platform supporting persistent Node.js processes, such as **Railway**, **Render**, or **Fly.io**.

---

## 2. Shared Prerequisites (Database)

Both applications share a single PostgreSQL database.
- **Provider**: Neon (serverless-friendly PostgreSQL) or another managed Postgres instance.
- **Migration**: Run `npx prisma migrate deploy` (or `pnpm db:migrate` locally) to ensure your production database is fully migrated to the latest schema before deploying.

---

## 3. Deploying the Web App (Next.js) to Vercel

Vercel natively supports Next.js pnpm monorepos. Follow these steps:

### Setup Steps
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log into the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` (Enable the "Vercel will build this directory from the root of your monorepo" option)
   - **Build Command**: `pnpm --filter @bidstand/web build` (or leave as default, since Vercel automatically runs the monorepo build)
5. **Environment Variables**: Add the following under the Environment Variables section:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `NEXTAUTH_SECRET`: A secure random string (e.g., generated with `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: The production URL of your Vercel deployment (e.g., `https://bidstand.vercel.app`).
   - `NEXT_PUBLIC_REALTIME_URL`: The production URL of your deployed Realtime Server (e.g., `https://bidstand-realtime.up.railway.app`).
   - `ROOM_JWT_SECRET`: A secure random string used to mint and sign room-scoped tokens. **Must exactly match the `ROOM_JWT_SECRET` configured on the Realtime Server.**

---

## 4. Deploying the Realtime Server (Express/Socket.io)

For the realtime server, we recommend **Railway** or **Render** because they offer simple config for monorepo Node.js services.

### Option A: Railway (Recommended)
1. Log into [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Choose your repository.
4. Go to the service settings:
   - **Root Directory**: Set to `apps/realtime` (or keep root and specify the build/start commands).
   - **Build Command**: `pnpm --filter @bidstand/realtime build` (Make sure root dependencies are installed).
   - **Start Command**: `node dist/server.js` or `tsx src/server.ts` (depending on build pipeline).
5. Go to **Variables** and add:
   - `DATABASE_URL`: Your production PostgreSQL connection string.
   - `ROOM_JWT_SECRET`: Same token secret as the Next.js Web App.
   - `ALLOWED_ORIGIN`: Your production Vercel app URL (e.g., `https://bidstand.vercel.app`).
   - `PORT`: `4000` (Railway will automatically expose the port, or use `${{PORT}}` injected dynamically by Railway).

### Option B: Render
1. Log into [Render](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your repository.
4. **Configure Service**:
   - **Name**: `bidstand-realtime`
   - **Language**: `Node`
   - **Root Directory**: `apps/realtime`
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm run build`
   - **Start Command**: `node dist/server.js`
5. **Environment Variables**:
   - `DATABASE_URL`, `ROOM_JWT_SECRET`, `ALLOWED_ORIGIN`, and `PORT`.
