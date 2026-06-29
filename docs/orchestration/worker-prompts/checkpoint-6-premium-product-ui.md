# Checkpoint 6 Worker Prompt: Premium Product UI

You are the Checkpoint 6 Premium Product UI implementation lane for Agent Factory.

Read first:
- `AGENTS.md`
- `docs/product-ui-redesign-plan.md`
- `docs/live-agentic-architecture.md`
- `docs/orchestration/checkpoint-6/README.md`
- `docs/orchestration/checkpoint-6/status.md`

Base state: `main` at the Checkpoint 6 base commit recorded in status.

## Goal

Redesign the Factory Console into a premium, judge-facing product UI inspired by the reference images the user added under `Ui References/`.

Target feel:
- dark enterprise shell
- polished navigation
- simple user flow
- beautiful, high-contrast panels
- live run timeline
- minimal explanatory proof text
- backend evidence available but secondary

## Ownership

You may edit:
- `apps/factory-console/src/**`
- `apps/factory-console/package.json` if needed
- `docs/product-ui-redesign-plan.md` if implementation notes change

Coordinate/avoid:
- Do not edit Factory API internals.
- Do not edit Build Worker internals.
- Do not commit reference PNGs unless explicitly directed by the orchestrator.

## Implementation Requirements

- Replace the current proof-board layout with four product views:
  - New Request
  - Build Plan & Governance
  - Live Run
  - Output Preview
- Use existing local seed/API state where needed, but structure the client to consume real lifecycle endpoints.
- Keep UI copy simple and customer-facing.
- Move technical evidence into a drawer/panel, not the primary surface.
- Fix current narrow wrapping issues in timeline/audit panels.
- Primary laptop widths are 1280-1920; keep responsive behavior acceptable but do not optimize at the expense of the demo laptop view.
- Use lucide icons already available.
- Do not use decorative gradient blobs/orbs.
- Avoid nested cards.
- Keep cards at 8px radius or less.

## Verification

Run:

```bash
npm --workspace @agent-factory/factory-console run typecheck
npm --workspace @agent-factory/factory-console run build
git diff --check
```

If possible, start the app and capture/browser-check the main views.

## Handoff

Report files changed, UX structure, how each view maps to lifecycle state, commands run, screenshots/browser checks if any, and known integration assumptions.
