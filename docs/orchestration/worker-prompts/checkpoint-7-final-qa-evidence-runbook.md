# Checkpoint 7 Worker Prompt: Final QA, Evidence, And Submission Runbook

You are the Checkpoint 7 Final QA, Evidence, And Submission Runbook lane for Agent Factory.

Read first:

- `AGENTS.md`
- `README.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/live-demo-runbook.md`
- `docs/submission-checklist.md`
- `docs/component-map.md`
- `docs/devpost-submission.md`

Base state: start after implementation lanes are merged, or from the planning commit if you are drafting QA docs only.

## Goal

Make the final Checkpoint 7 result testable, honest, and demo-ready.

## Ownership

You may edit:

- `docs/*`
- `docs/orchestration/checkpoint-7/status.md`
- `scripts/*` only for smoke/demo checks
- minor source fixes only if they are small integration gaps found during QA

Coordinate or avoid:

- Do not rewrite major UI/backend/build-worker behavior.
- Do not edit `.env`, `.env.local`, generated `dist`, `.uipath/.skills`, or `.agents/skills`.

## Requirements

- Update the truth table: live, local, import-ready, proposal-only, approval-gated.
- Add a step-by-step manual demo script for:
  - setup,
  - submit request,
  - answer generated clarifications,
  - review plan/governance,
  - approve,
  - run Codex build or explain blocked state,
  - show UiPath proof,
  - open sandbox preview,
  - show evidence.
- Confirm no wording claims full live UiPath orchestration unless actual live execution occurred.
- Confirm no raw secrets, API keys, or trace payloads appear in docs or screenshots.
- Update Checkpoint 7 status with checks and residual risks.

## Verification

Run after implementation lanes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

If a command cannot run, explain why and run the closest safe targeted check.

## Handoff

Report:

- checks run,
- failures fixed or remaining,
- final demo path,
- live evidence ids/links if any,
- residual risks,
- exact user steps to reproduce.

