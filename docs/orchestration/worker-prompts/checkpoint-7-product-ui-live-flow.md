# Checkpoint 7 Worker Prompt: Product UI Live Flow

You are the Checkpoint 7 Product UI Live Flow implementation lane for Agent Factory.

Read first:

- `AGENTS.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/product-ui-redesign-plan.md`
- `docs/live-demo-runbook.md`
- `apps/factory-console/src/App.tsx`
- `apps/factory-console/src/factoryClient.ts`
- `apps/factory-console/src/styles.css`

Also inspect the local reference images in `Ui References/` if available.

Base state: start from the Checkpoint 7 planning commit on `main`.

## Goal

Make the Factory Console feel like the reference product and make the primary flow use real lifecycle state instead of seed data.

## Ownership

You may edit:

- `apps/factory-console/src/*`
- focused frontend docs if needed

Coordinate or avoid:

- Backend endpoint/schema changes belong to the Agent Graph lane.
- Build Worker behavior belongs to the Codex lane.
- Do not edit `Ui References/`, `.env`, `.env.local`, generated `dist`, or `.agents/skills`.

## Implementation Requirements

- Preserve the dark premium shell and refine it toward the reference images.
- First screen should be a clean new-request experience, not a proof dashboard.
- Clarifying questions should appear after request submit.
- Use lifecycle APIs for:
  - intake/request creation,
  - clarify,
  - answers,
  - spec,
  - governance,
  - approve scope,
  - manifest,
  - build queue/status,
  - deployment evidence,
  - timeline.
- Do not silently fall back to seed state when the user is in live mode. Show explicit configuration/degraded states.
- Move technical proof panels into an evidence drawer or details section.
- Make primary laptop demo widths polished: `1280`, `1440`, `1920`.
- Keep text from overflowing in timeline/audit panels.
- `Open sandbox preview` must use deployment evidence URL.

## Verification

Run:

```bash
npm --workspace @agent-factory/factory-console run typecheck
npm --workspace @agent-factory/factory-console run build
git diff --check
```

If backend lanes are merged locally, also run:

```bash
npm run smoke
```

Use browser/Chrome screenshots for the four primary screens when practical.

## Handoff

Report:

- files changed,
- UI flow before/after,
- endpoint assumptions,
- screenshots if captured,
- checks run,
- remaining visual or integration risks.

