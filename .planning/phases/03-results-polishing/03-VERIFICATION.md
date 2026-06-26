# Phase 3 Verification: Results & Polishing

## 1. Automated Checks
- `pnpm typecheck` must pass in `apps/web`.
- `pnpm lint` must pass.

## 2. Manual Verification Checklist
- **Early Access**: Access `/room/[code]/results` while the auction is running. Verify "wrapping up" state.
- **Auto Transition**: End the auction (let last player resolve or click end early). Verify all tabs automatically redirect to `/room/[code]/results`.
- **Squad Display**: Verify squad count, prices paid, and remaining purse calculations.
- **Unsold List**: Verify all unsold players are correctly listed.
