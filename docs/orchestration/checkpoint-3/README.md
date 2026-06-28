# Checkpoint 3 - Build Worker, Codex, And Git Evidence

## Goal

Build the first end-to-end worker path for the Governed Agentic Automation Factory. An approved Customer360 manifest should be able to queue a sandbox build, create an isolated workspace, run Codex through a bounded and auditable runner, collect file/test evidence, and report a local diff or GitHub PR URL when credentials are available.

This checkpoint remains local-first and `uipath-ready`. It does not create live Maestro, Data Service, Action Center, API Workflow, Test Manager, deployment, or production releases. Those belong to Checkpoints 4 and 5.

## Baseline

- Integration branch: `main`
- Base commit: `9a8a332`
- Checkpoint 1 and Checkpoint 2 are merged, pushed, and verified.
- `codex --version` reports `codex-cli 0.142.3`.

## Lanes

### 1. Build Worker Core And API

- Prompt: [worker-core-api.md](../worker-prompts/checkpoint-3-worker-core-api.md)
- Owns: `services/build-worker/src/index.ts`, `services/build-worker/src/server.ts`, `services/build-worker/src/store.ts`, `services/build-worker/src/manifest.ts`, `services/build-worker/src/workspace.ts`, related build-worker core modules.
- Produces: `/health`, `POST /build`, `GET /build/:id`, manifest validation, in-memory run store, workspace planning, lifecycle events, and dependency-injected runner interfaces.

### 2. Codex Runner

- Prompt: [codex-runner.md](../worker-prompts/checkpoint-3-codex-runner.md)
- Owns: `services/build-worker/src/codex/**`, `services/build-worker/prompts/**`.
- Produces: Codex command construction, sandboxed execution wrapper, JSONL/stdout capture, bounded repair attempt, prompt templates, and secret-safe log shaping.

### 3. Git Evidence And Artifacts

- Prompt: [git-artifacts.md](../worker-prompts/checkpoint-3-git-artifacts.md)
- Owns: `services/build-worker/src/git/**`, `services/build-worker/src/artifacts/**`, `services/build-worker/src/github/**`.
- Produces: branch/diff metadata, changed-file artifact list, optional GitHub PR creation when `GITHUB_PAT_TOKEN` exists, and honest local fallback when it does not.

### 4. Worker QA, Security, And Docs

- Prompt: [worker-qa-security.md](../worker-prompts/checkpoint-3-worker-qa-security.md)
- Owns: `services/build-worker/test/**`, `docs/build-worker.md`, root/package smoke scripts where needed.
- Produces: tests for manifest validation, no-key behavior, status transitions, Codex command safety, no-secret/no-raw-PII scans, smoke script, and runbook docs.

## Merge Order

1. Build Worker Core And API.
2. Codex Runner.
3. Git Evidence And Artifacts.
4. Worker QA, Security, And Docs.
5. Orchestrator integration patch for Factory API/Console drift if needed.

## Cross-Lane Contracts

- Workers must keep source edits within ownership boundaries.
- New core types should be exported from `services/build-worker/src/index.ts` where downstream lanes can consume them after merge.
- Codex execution must default to `workspace-write`, `--skip-git-repo-check`, and sandbox-only Customer360 file boundaries.
- No worker may read or print `.env`, tokens, credential files, browser storage, or secrets.
- GitHub integration must be optional. If no token is present, return local branch/diff evidence without failing the build.
- Do not commit generated `dist/**`, `node_modules/**`, `.uipath/.skills`, `.agents/skills`, worker temp workspaces, or local logs.
- Live UiPath status remains `uipath-ready` or `local-simulated`; do not claim `uipath-live`.

## Expected API Shape

The exact implementation can evolve, but the final worker should support:

- `GET /health`
- `POST /build` with a worker-facing manifest or a Factory API manifest projection.
- `GET /build/:id`
- run statuses covering queued, building, tests, artifact capture, failed, and completed/awaiting release approval.
- build result fields for worker id, Codex session/log path, branch name, commit sha, PR URL when available, generated files, checks, and failure reason.

## Verification

Run after all lanes merge:

```bash
npm --workspace @agent-factory/build-worker test
npm --workspace @agent-factory/build-worker run build
npm run smoke:build-worker
npm run smoke
npm audit --audit-level=moderate
git diff --check
codex exec --sandbox read-only --skip-git-repo-check "Reply only: Codex ready."
```

If live Codex execution is too costly during tests, the worker must support an injected fake runner and keep real Codex readiness as a separate smoke check.

## Manual Smoke

- Start the build worker.
- Trigger a Customer360 sandbox build from a valid manifest.
- Confirm run status transitions and logs are visible.
- Confirm changed files or a deliberate no-op diff are reported.
- Confirm tests/checks are recorded.
- Confirm GitHub PR URL appears only when credentials are configured; otherwise confirm local diff fallback.

## Non-Goals

- Live UiPath Maestro/Data Service/Action Center creation.
- Production deployment.
- Broad arbitrary app generation beyond the Customer360 allowlist.
- Reading secrets or invoking unapproved external services.
