FROM node:20-bullseye-slim

# Enable corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy configuration and package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/realtime/package.json ./apps/realtime/

# Create a dummy package.json for apps/web so pnpm doesn't fail due to workspace mismatch
RUN mkdir -p apps/web && echo '{"name": "@bidstand/web", "dependencies": {"@bidstand/db": "workspace:*", "@bidstand/shared": "workspace:*", "@gsap/react": "^2.1.2", "@phosphor-icons/react": "^2.1.10", "bcryptjs": "^2.4.3", "gsap": "^3.15.0", "jose": "^5.2.4", "lucide-react": "^0.378.0", "next": "^14.2.3", "next-auth": "^4.24.7", "react": "^18.3.1", "react-dom": "^18.3.1", "socket.io-client": "^4.7.5", "zod": "^3.22.4"}, "devDependencies": {"@types/bcryptjs": "^2.4.6", "@types/node": "^20.12.7", "@types/react": "^18.3.1", "@types/react-dom": "^18.3.1", "autoprefixer": "^10.4.19", "eslint": "^8.56.0", "eslint-config-next": "^14.2.3", "postcss": "^8.4.38", "prisma": "^5.13.0", "tailwindcss": "^3.4.3", "typescript": "^5.4.5"}}' > apps/web/package.json

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
