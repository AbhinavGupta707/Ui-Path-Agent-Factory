# Build Worker Runbook

The build worker is the local-first Checkpoint 3 service that receives an approved Customer360 build manifest, plans a constrained Codex run, records quality evidence, and returns either local diff evidence or an optional GitHub PR link. Ordinary tests use injected fakes and fixtures; they do not require live Codex, GitHub, UiPath, or browser automation.

## Local Commands

Install dependencies from the repository root:

```bash
npm install
```

Run the worker checks:

```bash
npm --workspace @agent-factory/build-worker test
npm --workspace @agent-factory/build-worker run build
npm run smoke:build-worker
```

Start the scaffold worker server:

```bash
npm run dev:worker
```

The server listens on `BUILD_WORKER_PORT` or `8790` by default and currently responds with a scaffold health payload.

## Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `BUILD_WORKER_PORT` | No | Local HTTP port for the scaffold server. |
| `GITHUB_PAT_TOKEN` | No | Enables future PR creation. When absent, the worker must return local branch/diff evidence instead of failing. |
| `CODEX_MODEL` | No | Future override for the Codex model. The current manifest fixture uses `gpt-5.5`. |

Do not put tokens, `.env` files, browser storage, Orchestrator assets, or UiPath credentials in manifests, logs, generated artifacts, docs, or tests.

## No-Key Behavior

GitHub is optional for Checkpoint 3. If `GITHUB_PAT_TOKEN` is missing, the quality path should still complete and report:

- branch name;
- changed/generated file list;
- local diff or artifact summary;
- checks run and pass/fail status;
- no `pr_url`.

This is the expected demo fallback when live GitHub automation is unavailable. A missing GitHub token is not a build failure.

## GitHub And PR Behavior

When a token is configured by the Git/artifact lane, PR creation should happen after the build and test evidence is available. The worker should still redact logs and return a safe local evidence summary if PR creation fails. PR links must only be reported when creation actually succeeds.

## Codex Readiness

Routine tests do not invoke live Codex. Check live readiness separately:

```bash
codex exec --sandbox read-only --skip-git-repo-check "Reply only: Codex ready."
```

The production invocation must use `workspace-write`, `--skip-git-repo-check`, an isolated workspace, and the approved Customer360 manifest plus local `AGENTS.md` instructions. Repair attempts are bounded by the manifest and should redact prior logs before including them in repair context.

## Guardrail Coverage

The build-worker tests cover:

- Customer360 template allowlisting;
- unsafe file-boundary rejection for parent traversal, absolute paths, `.env`, `node_modules`, generated output, `.uipath/.skills`, `.agents/skills`, and disallowed template paths;
- Codex command construction for `workspace-write` and `--skip-git-repo-check`;
- bounded fake repair behavior without live Codex;
- no-token local GitHub fallback behavior;
- queued, building, tests, artifact capture, approval-ready, build failure, and test failure status paths through injected fakes;
- no-secret and no-raw-PII scans over fake worker logs/results.

## Demo Steps

1. Run `npm run smoke:build-worker`.
2. Start the worker with `npm run dev:worker`.
3. From the Factory API or a local API Workflow simulation, submit an approved Customer360 manifest.
4. Confirm the worker reports build queued/building/test/artifact evidence states.
5. Confirm GitHub PR output appears only when credentials are configured; otherwise show the local diff fallback.
6. Run the separate Codex readiness command before a live demo if Codex will be invoked.
7. Hand the result back to Maestro/Action Center for release approval before sandbox deployment.

## Integration Notes

Checkpoint 4 should keep UiPath as the lifecycle owner: Maestro triggers the worker, Data Service stores build/test/audit records, Action Center gates scope and release approval, and API Workflows poll or receive worker status. The worker should continue to label local-only execution as `local-simulated` or `uipath-ready`, not `uipath-live`.
