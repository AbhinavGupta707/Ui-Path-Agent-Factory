# Checkpoint 6 Worker Prompt: Codex Build Worker Orchestration

You are the Checkpoint 6 Codex Build Worker Orchestration implementation lane for Agent Factory.

Read first:
- `AGENTS.md`
- `docs/build-worker.md`
- `docs/live-agentic-architecture.md`
- `docs/checkpoint-6-live-activation-plan.md`
- `docs/orchestration/checkpoint-6/README.md`
- `docs/orchestration/checkpoint-6/status.md`

Base state: `main` at the Checkpoint 6 base commit recorded in status.

## Goal

Move the Build Worker closer to a live Codex/Git execution path while preserving safety. Codex remains the heavy repo-aware builder; Fireworks/LangGraph-style agents plan and validate around it.

## Ownership

You may edit:
- `services/build-worker/src/**`
- `services/build-worker/test/**`
- `docs/build-worker.md`
- `docs/checkpoint-6-live-activation-plan.md`
- `scripts/**` only if needed for worker smoke/run support

Coordinate/avoid:
- Do not redesign Factory Console.
- Do not change Factory API contracts unless you document exact integration needs.
- Do not commit generated workspaces, `.env.local`, tokens, or build output.

## Implementation Requirements

- Preserve manifest allowed-file enforcement.
- Expose clear run status/evidence for UI polling.
- Add or improve Codex runner configuration checks.
- Add safe no-Codex/no-GitHub degraded behavior.
- Ensure logs are bounded and redacted.
- If real Codex CLI invocation is not safe to fully automate yet, implement the integration seam and tests with a mock/injected runner.
- Keep `GITHUB_PAT_TOKEN` optional; local branch/diff evidence must remain valid.

## Verification

Run:

```bash
npm --workspace @agent-factory/build-worker run build
npm --workspace @agent-factory/build-worker run test
npm run smoke:build-worker
git diff --check
```

## Handoff

Report files changed, runner behavior, how Codex is invoked or prepared to invoke, commands run, risks, and what Factory API/UI need to consume.
