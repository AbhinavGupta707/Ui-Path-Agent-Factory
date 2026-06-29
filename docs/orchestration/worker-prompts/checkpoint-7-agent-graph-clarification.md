# Checkpoint 7 Worker Prompt: Agent Graph And Clarification

You are the Checkpoint 7 Agent Graph And Clarification implementation lane for Agent Factory.

Read first:

- `AGENTS.md`
- `README.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/live-agentic-architecture.md`
- `services/factory-api/src/agentRuntime.ts`
- `services/factory-api/src/index.ts`
- `services/factory-api/src/lifecycle.ts`

Base state: start from the Checkpoint 7 planning commit on `main`.

## Goal

Make clarification a real post-submit agent step and shape the Factory API lifecycle as a graph/run rather than a seeded walkthrough.

## Ownership

You may edit:

- `services/factory-api/src/*`
- `services/factory-api/test/*`
- `packages/shared-contracts/src/*`
- focused docs needed for API behavior

Coordinate or avoid:

- `apps/factory-console/*` belongs to the UI lane except for tiny contract examples.
- `services/build-worker/*` belongs to the Codex lane.
- Do not edit `.env`, `.env.local`, generated `dist`, or `.agents/skills`.

## Implementation Requirements

- `POST /api/requests/:id/clarify` must generate questions after request creation.
- Use the existing provider runtime patterns: live, deterministic, degraded-no-key, degraded-provider-error.
- If adding LangGraph dependencies, keep usage server-side and document why.
- If not adding LangGraph yet, implement a graph-shaped abstraction with explicit nodes and transitions so a later LangGraph swap is narrow.
- Clarification output must be schema-validated.
- Questions must be based on the request, selected sources, metrics, constraints, and missing fields.
- Fallback questions must be labeled as deterministic/degraded in audit/trace metadata.
- Do not persist raw prompts, raw model responses, keys, emails, or phone numbers.
- Preserve existing deterministic no-secret tests.

## Verification

Run:

```bash
npm --workspace @agent-factory/shared-contracts run build
npm --workspace @agent-factory/factory-api test
npm --workspace @agent-factory/factory-api run build
git diff --check
```

If dependencies change, also run:

```bash
npm install
npm run smoke
```

## Handoff

Report:

- files changed,
- endpoint behavior,
- live/degraded/fallback behavior,
- tests run,
- any dependency changes,
- API contract notes for UI lane,
- residual risks.

