# AI Usage Summary

Tools used:
- Gemini (via Antigravity)
- Codex/GSD planning workflow
- OpenCode
- Kimchi (minimax-m3)
- Local shell execution (run_command, prisma CLI, pnpm CLI, docker CLI, hf CLI)

What AI helped with:
- Initial project architecture analysis
- Setting up the AI usage tracking files and updating repository rules
- Mapping out file structures and roadmap compliance
- Phase 1 research, walking skeleton definition, pattern mapping, and executable PLAN.md creation
- Pre-execution plan verification for requirement coverage, task completeness, security threat model coverage, and post-planning gaps
- Creating monorepo workspaces and setting up strict TypeScript configuration
- Defining the Prisma schema and generating database client
- Implementing Express/Socket.io realtime server for presence tracking
- Building Next.js routes for Commissioner auth, room creation wizard, room joining, and Lobby UI
- Implementing the live bidding state machine, server countdown timers, and active state transitions in Phase 2
- Building the `/api/rooms/[code]/results` API and detailed frontend results page with live socket connection in Phase 3
- Creating the production deployment configurations and fixing Next.js monorepo build errors by adding `prisma generate` directly to the `@bidstand/db` build pipeline
- Configured and deployed the stateful Express/Socket.io realtime server to Hugging Face Spaces using the Hugging Face CLI with a custom Docker configuration.
- Added Zod schema and server-side validation for kicking participants from a room
- Refactored socket communication into dedicated service modules for maintainability
- Added `.env.example` files for consistent environment setup across both apps
- Captured this Kimchi session into `ai-transcripts/kimchi-session-1.jsonl` and refreshed `ai-usage-summary.md` so the transcript set covers every AI tool used to build Bidstand (Gemini, OpenCode, Kimchi)

Important manual decisions:
- Proceeded with Phase 1 planning without a `CONTEXT.md` from discuss-phase.
- Chose to research before planning.
- Split Phase 1 into three executable plans instead of the roadmap's original single coarse plan to keep execution context bounded.
- Replaced NextAuth with custom signed JWT tokens to make integration fast and extremely robust in development.
- Modified the join response payload to return the signed token in JSON to avoid cookie sharing issues across localhost ports.
- Designed results page with a fallback polling system (every 3 seconds) for users without a socket connection token.
- Configured packages/db build script to run `prisma generate` dynamically so that client generation succeeds automatically inside Vercel's build pipeline.
- Created a clean temporary deployment directory structure to bypass uploading bulky `node_modules` during the Hugging Face upload.
- Downgraded Node.js from 22 to 20 in Dockerfile to match Hugging Face Spaces runtime constraints.
- Added `binaryTargets` to Prisma schema and direct `@prisma/client` dependency to fix Vercel deployment query engine errors.
- Used a dummy `packages/web` package inside the Docker build to satisfy pnpm's strict workspace dependency resolution.

Known limitations:
- Vercel's serverless/edge runtime is stateless and short-lived, meaning the stateful Express/Socket.io server must be deployed separately on a persistent server platform like Railway, Render, or Hugging Face Spaces.
- Prisma Client must be generated at build time in CI/CD — the monorepo's package manager does not automatically cross-build workspace dependencies during `vercel build`.
- Kimchi's contribution to this project is limited to a single bookkeeping session (transcript capture + summary refresh); the bulk of the implementation was done in earlier Gemini/Antigravity and OpenCode sessions captured in the other JSONL files in this directory. Future Kimchi sessions can extend this with their own numbered transcript files (e.g. `kimchi-session-2.jsonl`).


