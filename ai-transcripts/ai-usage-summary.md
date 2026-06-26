# AI Usage Summary

Tools used:
- Gemini (via Antigravity / Claude Code compatible interface)
- Codex/GSD planning workflow
- Local shell execution (run_command, prisma CLI, pnpm CLI)

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

Important manual decisions:
- Proceeded with Phase 1 planning without a `CONTEXT.md` from discuss-phase.
- Chose to research before planning.
- Split Phase 1 into three executable plans instead of the roadmap's original single coarse plan to keep execution context bounded.
- Replaced NextAuth with custom signed JWT tokens to make integration fast and extremely robust in development.
- Modified the join response payload to return the signed token in JSON to avoid cookie sharing issues across localhost ports.
- Designed results page with a fallback polling system (every 3 seconds) for users without a socket connection token.

Known limitations:
- None identified for Phase 3. The system implements all PRD and user flow requirements.
