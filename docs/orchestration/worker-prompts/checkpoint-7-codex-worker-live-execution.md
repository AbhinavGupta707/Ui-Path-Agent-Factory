# Checkpoint 7 Worker Prompt: Codex Worker Live Execution

You are the Checkpoint 7 Codex Worker Live Execution implementation lane for Agent Factory.

Read first:

- `AGENTS.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/build-worker.md`
- `services/build-worker/src/runtime.ts`
- `services/build-worker/src/codex/live-runner.ts`
- `services/build-worker/src/codex/runner.ts`
- `services/build-worker/src/codex/prompts.ts`

Base state: start from the Checkpoint 7 planning commit on `main`.

## Goal

Make the Build Worker ready to run Codex live in a safe, opt-in way and expose honest evidence for the UI.

## Ownership

You may edit:

- `services/build-worker/src/*`
- `services/build-worker/test/*`
- `docs/build-worker.md`
- focused shared contracts only if necessary and coordinated in handoff

Coordinate or avoid:

- Factory API lifecycle contract belongs to Agent Graph lane.
- Factory Console UI belongs to Product UI lane.
- Do not enable live Codex by default.
- Do not edit `.env`, `.env.local`, generated `dist`, or `.agents/skills`.

## Implementation Requirements

- Keep `BUILD_WORKER_CODEX_ENABLED=true` as the opt-in live switch.
- Add or verify readiness evidence for Codex auth, executable, model, sandbox, and workspace.
- Use isolated workspace per build.
- Write approved manifest/instructions into the workspace.
- Capture Codex event stream or JSONL evidence with output limits and redaction.
- Enforce allowed files and forbidden actions before marking a build successful.
- Report `blocked` clearly when Codex is disabled, unavailable, unauthenticated, or unsafe.
- Preserve no-GitHub mode as local branch/diff evidence.
- Do not expose provider keys or Codex auth tokens to untrusted build/test commands.

## Verification

Run:

```bash
npm --workspace @agent-factory/build-worker test
npm --workspace @agent-factory/build-worker run build
npm run smoke:build-worker
git diff --check
```

If live Codex is approved separately, run the narrowest safe live readiness check and record only redacted evidence.

## Handoff

Report:

- files changed,
- how to enable live Codex safely,
- blocked/error states,
- checks run,
- live checks skipped or run,
- UI/API evidence fields the frontend can display.

