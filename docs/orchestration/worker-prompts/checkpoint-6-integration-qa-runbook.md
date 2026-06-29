# Checkpoint 6 Worker Prompt: Integration QA And Live Runbook

You are the Checkpoint 6 Integration QA And Live Runbook lane for Agent Factory.

Read first:
- `AGENTS.md`
- `docs/setup.md`
- `docs/component-map.md`
- `docs/live-agentic-architecture.md`
- `docs/product-ui-redesign-plan.md`
- `docs/checkpoint-6-live-activation-plan.md`
- `docs/orchestration/checkpoint-6/README.md`
- `docs/orchestration/checkpoint-6/status.md`

Base state: `main` at the Checkpoint 6 base commit recorded in status.

## Goal

Own the documentation and verification surface for Checkpoint 6. Prepare a live demo runbook and integration checklist that match the new product architecture and UI.

## Ownership

You may edit:
- `docs/**`
- `README.md`
- `scripts/**` only for non-secret QA helpers

Coordinate/avoid:
- Do not edit app UI code.
- Do not edit provider runtime or build-worker internals.
- Do not run live UiPath mutations.
- Do not print or commit secrets.

## Implementation Requirements

- Add or update a live demo runbook explaining:
  - setup
  - provider key validation
  - local startup
  - manual product workflow
  - what is live, local, import-ready, or approval-gated
  - how Codex, Fireworks, LangSmith, and UiPath work together
- Keep claims honest.
- Update component/status docs if product state changes.
- Add no-secret validation guidance.
- Include demo-video narration notes that explain backend complexity verbally while UI stays clean.

## Verification

Run:

```bash
npm run demo:scan
git diff --check
```

If feasible after other lanes land, run:

```bash
npm run smoke:demo
```

## Handoff

Report docs changed, checks run, remaining manual verification, and any claim wording risks.
