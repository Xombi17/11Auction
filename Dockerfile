FROM node:22-slim

# Enable corepack to use pnpm
RUN corepack enable

WORKDIR /app

# Copy configuration and package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/realtime/package.json ./apps/realtime/

# Install dependencies (using cache mounts for speed)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod=false

# Copy codebase
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY apps/realtime ./apps/realtime

# Set dummy DATABASE_URL during build phase so Prisma client can compile successfully without real credentials
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Build the workspace
RUN pnpm --filter @bidstand/db build && \
    pnpm --filter @bidstand/shared build && \
    pnpm --filter @bidstand/realtime build

# Create a non-root user (Hugging Face Spaces runs as UID 1000)
RUN chown -R 1000:1000 /app

USER 1000

ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["pnpm", "--filter", "@bidstand/realtime", "start"]
