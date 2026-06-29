# Checkpoint 6 Worker Prompt: Agent Runtime And Provider Wiring

You are the Checkpoint 6 Agent Runtime And Provider Wiring implementation lane for Agent Factory.

Read first:
- `AGENTS.md`
- `docs/live-agentic-architecture.md`
- `docs/checkpoint-6-live-activation-plan.md`
- `docs/orchestration/checkpoint-6/README.md`
- `docs/orchestration/checkpoint-6/status.md`

Base state: `main` at the Checkpoint 6 base commit recorded in status.

## Goal

Add the server-side foundation for live Fireworks/LangSmith-backed agent orchestration. This lane should make provider configuration typed, safe, testable, and ready for Factory API lifecycle steps to call.

## Ownership

You may edit:
- `services/factory-api/src/**`
- `services/factory-api/test/**`
- `packages/shared-contracts/src/**`
- `packages/shared-contracts/test/**`
- `docs/live-agentic-architecture.md`
- `docs/checkpoint-6-live-activation-plan.md`
- new docs under `docs/` if needed

Coordinate/avoid:
- Do not redesign `apps/factory-console`.
- Do not change Build Worker Codex execution internals except shared contract types if absolutely needed.
- Do not edit `.env.local` or commit secrets.

## Implementation Requirements

- Load provider config from environment without printing secrets.
- Support model profiles: fast, reasoning, code, fallback.
- Add Fireworks OpenAI-compatible chat client abstraction.
- Add LangSmith tracing metadata hooks or trace envelope structure, even if full SDK wiring is deferred.
- Add schema-first agent step outputs for at least: intake classification, requirements/spec generation, governance, build plan.
- Add degraded/no-key behavior that is explicit and honest.
- Keep local deterministic fallback available for tests, but never silently claim it is live model output.
- Prevent raw PII/secrets from logs and trace payloads.

## Verification

Run:

```bash
npm --workspace @agent-factory/shared-contracts run build
npm --workspace @agent-factory/shared-contracts run test
npm --workspace @agent-factory/factory-api run build
npm --workspace @agent-factory/factory-api run test
git diff --check
```

If live key calls are tested, keep prompts tiny and do not print secrets.

## Handoff

Report files changed, contracts added, env vars required, tests run, live-provider behavior, degraded behavior, and any integration notes for UI/Build Worker lanes.
