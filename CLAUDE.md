# CLAUDE.md

Claude Code reads this file automatically on every session in this repo.

@AGENTS.md

> If your Claude Code version doesn't support the `@file` import syntax above, just
> paste the full contents of `AGENTS.md` in here directly — they're meant to stay
> identical. `AGENTS.md` is the canonical copy (other tools like Cursor/Codex/OpenCode
> read it directly); this file is Claude Code's entry point plus the notes below.

## GSD-Specific Notes

This project is being built with the GSD ("Get Shit Done") workflow
(`@opengsd/get-shit-done-redux` — see `docs/ROADMAP.md` for the security note on why
it's *not* the original `get-shit-done-cc` package).

- `docs/PRD.md` is the seed spec for `/gsd-new-project`.
- `docs/ROADMAP.md` is a starting-point phase breakdown — GSD will generate its own
  roadmap into `.planning/`; treat disagreements as something to resolve during
  `/gsd-discuss-phase`, not by editing this file.

- During `/gsd-discuss-phase N`, point Claude at the specific doc section relevant to
  that phase (e.g. for the timer/resolution phase, `docs/ARCHITECTURE.md` §3.3–3.4 and
  `docs/USER_FLOWS.md` §5) rather than re-explaining it from scratch in the chat.

- Don't let GSD's own internal skill/agent files (under `~/.claude/skills/gsd-*/`) get
  confused with this repo's own `docs/` — this repo's docs describe *Bidstand*, GSD's
  files describe *how GSD itself works*. If Claude ever seems to be reasoning about the
  wrong one, point it back at `docs/`.

## Claude-Code Workflow Reminders

- Prefer running one GSD phase at a time end-to-end (discuss → plan → execute → verify →
  ship) over letting context span multiple phases — that's the entire point of the
  fresh-context-per-phase design; don't shortcut it by cramming multiple phases into one
  long chat.

- When asked to "just fix it quickly" outside the phase loop, `/gsd-quick` (or the
  redux-fork equivalent — check `/gsd-help` for the current command name) exists for
  exactly that; use it instead of derailing an in-progress phase.

- Before generating any new screen, skim `docs/DESIGN_SYSTEM.md` — don't invent a new
  visual language per component.

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Bidstand**

A realtime cricket franchise player auction room (IPL-style) where a Commissioner runs a live player auction and Team Owners bid against each other, under a fixed budget, for a fixed pool of players.

**Core Value:** Realtime server-authoritative auction logic updates across all tabs instantly without manual refresh.

### Constraints

- **Tech Stack**: Next.js, Express, Socket.io, Prisma, Tailwind CSS, TypeScript.
- **Data type**: Currency represented as integer in Lakhs (1 Lakh = 1 unit) to avoid floating point bugs.
- **Architecture**: Realtime server is the only thing that ever decides an auction outcome.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Technology Stack

### Core Technologies

- **Next.js 15 (App Router)**: Frontend application, static pages (Lobby, Join, Dashboard, Results), and REST-ish API endpoints for authentication and room configuration.
- **Express + Socket.io 4.x**: Separate server for realtime websocket communication, authoritative countdown timers, and live bidding state machine logic.
- **Prisma + PostgreSQL**: Database schema management, ORM, and persistent storage of rooms, teams, players, and auction outcomes.
- **TypeScript**: Shared type definitions across `apps/web` (Next.js), `apps/realtime` (Socket.io), and `packages/shared`.
- **Zod**: Input schema validation for all API bodies and Socket.io incoming payloads to guarantee server-side correctness.
- **JSON Web Tokens (jsonwebtoken)**: Room-scoped authorization signed by a shared secret (`ROOM_JWT_SECRET`) between Next.js and Socket.io servers.

### Styling

- **Tailwind CSS**: Rapid UI styling using utility classes (or Vanilla CSS for layout components if configured).

### Key Libraries

- **Lucide React**: Premium micro-icon set.
- **Canvas-Confetti**: Client-side feedback on successful player sale.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
