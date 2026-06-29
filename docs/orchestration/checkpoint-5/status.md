# Checkpoint 5 Status

## Worker Sessions

Worker IDs are filled in by the orchestrator after thread creation.

| Lane | Thread | Pending ID | Worktree | Status | Notes |
|---|---|---|---|---|---|
| Deployment And Runtime | 019f110f-8b3e-75d2-858b-c50876c16f4b | local:677327e3-e365-4662-8b94-2f260e128b39 | /Users/abhinavgupta/.codex/worktrees/26cf/Agent Factory | merged | App-managed worker committed `dd7f3c1`; merged to `main`; previous CLI scratch worktree `/private/tmp/agent-factory-cp5/deployment-runtime` is superseded and is not a merge candidate |
| Demo UX Polish | 019f110f-d1c8-7410-b2c0-1f42442094c5 | local:27ea581e-05f9-419b-92a4-b98a7d499aa0 | /Users/abhinavgupta/.codex/worktrees/036b/Agent Factory | merged | App-managed worker committed `d5ad78e`; merged to `main`; previous CLI scratch worktree `/private/tmp/agent-factory-cp5/demo-ux-polish` is superseded and is not a merge candidate |
| Submission Package | 019f1110-114e-75c2-b93a-750d658bf18e | local:9f964e87-a266-41c3-b057-5e52038b4ad4 | /Users/abhinavgupta/.codex/worktrees/eb3f/Agent Factory | merged | App-managed worker committed `43a33a8`; merged to `main` with setup doc conflict resolved to preserve deployment runtime instructions; previous CLI scratch worktree `/private/tmp/agent-factory-cp5/submission-package` is superseded and is not a merge candidate |
| Final QA And E2E | 019f1110-4fa6-7fe3-9eab-a7d6eceef6c6 | local:3ac17817-0fe4-4d73-9fb9-938fb7fb373c | /Users/abhinavgupta/.codex/worktrees/5956/Agent Factory | merged | App-managed worker committed `088025a`; adds local demo reset/smoke/privacy scan layer; browser visual automation was blocked in the worker by missing IAB/Chrome backend; previous CLI scratch worktree `/private/tmp/agent-factory-cp5/final-qa-e2e` is superseded and is not a merge candidate |

## Integration Log

- Created Checkpoint 5 orchestration docs and worker prompts from `main` after Checkpoint 4 completion.
- Launch base commit: `c437f8c`.
- Created four local git worktrees under `/private/tmp/agent-factory-cp5` from initial prep base `5f6bb16`.
- In-app `list_projects`/`create_thread` handlers were unavailable in this session, so the orchestrator prepared a CLI-worker fallback.
- Codex CLI worker launch was initially paused pending explicit user approval because it sends repository context and checkpoint instructions to the Codex model service.
- User explicitly approved continuing with the CLI worker fallback after the orchestrator explained the app handler and sandbox-reviewer issues.
- Fast-forwarded all four prepared worktrees from `5f6bb16` to `df432f9` before launch.
- Launched all four Checkpoint 5 CLI workers at approximately `2026-06-29T01:38:47Z`.
- User interrupted the CLI monitor turn before worker handoffs were produced.
- Rechecked the local process handles after interruption; all four handles were gone and no handoff files existed.
- The interrupted CLI worktrees contain partial scratch diffs in three lanes and no Final QA changes. They are retained only for inspection and must not be merged.
- App-managed `list_projects` / `create_thread` tools became available after the interruption, so Checkpoint 5 will be relaunched through normal app-managed worktree sessions.
- Queued four app-managed Checkpoint 5 worktree sessions from `main` after cleanup commit `c437f8c`.
- Resolved all four Checkpoint 5 app-managed workers to active Codex threads and checkout paths.
- Deployment And Runtime completed at commit `dd7f3c1` and was merged into `main` with `Merge checkpoint 5 deployment runtime`.
- Demo UX Polish completed at commit `d5ad78e` and was merged into `main` with `Merge checkpoint 5 demo UX polish`.
- Submission Package completed at commit `43a33a8` with README/setup/UiPath runbook updates plus new demo script, Devpost copy, component map, and submission checklist; it was merged into `main` after Demo UX. The `docs/setup.md` conflict was resolved to keep both the beginner runbook and the new sandbox `/deploy` evidence contract.
- Pre-launch `npm run smoke` passed across workspace builds and tests.
- Pre-launch CLI probes confirmed:
  - `uip login status --output json` passed for `galacticus / DefaultTenant`.
  - `gh --version` returned `2.89.0`.
  - `vercel --version` returned `54.9.1`.
  - `git remote -v` points to `AbhinavGupta707/Ui-Path-Agent-Factory.git`.
- Final QA And E2E app-managed lane added:
  - `npm run demo:reset` for deterministic Customer360 rehearsal state under the OS temp directory.
  - `npm run demo:scan` / `demo:scan:strict` for privacy/security copy and source checks.
  - `npm run smoke:demo` for reset, scan, Factory API lifecycle tests, build-worker smoke, Factory Console checks, and Customer360 smoke.
  - `docs/qa-checklist.md` and `docs/final-readiness.md` for browser checklist, command evidence, scan results, and residual risks.
- Final QA And E2E completed at commit `088025a` and was merged into `main` as the final lane.
- Final QA local browser-use attempt found the Node REPL browser tool callable, but the in-app browser backend was not discoverable. Chrome-specific control was not exposed. Local UI route/source-marker smoke passed against localhost instead.

## Launch Baseline

| Item | Value |
|---|---|
| Branch | `main` |
| Base commit | `c437f8c` |
| Launch time UTC | `2026-06-29T01:38:47Z` |
| UiPath CLI | `1.195.1` |
| GitHub CLI | `2.89.0` |
| Vercel CLI | `54.9.1` |
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Checks Run

- Pre-launch `npm run smoke` passed.
- Pre-launch `uip login status --output json` passed.
- Pre-launch `gh --version` passed.
- Pre-launch `vercel --version` passed.
- Pre-launch `git remote -v` passed.
- Worktree preparation passed for all four Checkpoint 5 lanes.
- Initial CLI worker execution launched after explicit user approval, then was superseded by app-managed relaunch preparation.
- Deployment And Runtime post-merge checks passed: `npm --workspace @agent-factory/factory-api test`, `npm --workspace @agent-factory/factory-api run build`, `uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json`, `vercel --version`, `node scripts/deploy-sandbox.mjs --target=customer360`, and `git diff --check`.
- Demo UX post-merge checks passed: `npm --workspace @agent-factory/factory-console run typecheck`, `npm --workspace @agent-factory/factory-console run build`, `npm --workspace @agent-factory/customer360-template run typecheck`, `npm --workspace @agent-factory/customer360-template run build`, and `npm --workspace @agent-factory/customer360-template test`.
- Submission Package lane checks reported: stale wording scan passed, `git diff --check` passed, `git diff --cached --check` passed, and `npm run smoke` passed after workspace dependency install in the isolated worktree.
- Submission Package post-merge checks passed: `git diff --check` and a focused stale-wording scan; remaining matches are intentional wording in README and the worker prompt.
- Final QA lane `npm ci` passed with 105 packages installed and 0 reported vulnerabilities.
- Final QA lane `npm run lint` passed; root lint now runs the privacy/security scan plus no-op workspace lint.
- Final QA lane `npm run typecheck` passed after root typecheck was ordered to build shared package outputs first.
- Final QA lane `npm test` passed: 5 test files and 67 tests.
- Final QA lane `npm run build` passed.
- Final QA lane `npm run smoke` passed.
- Final QA lane `npm run smoke:demo` passed. The privacy/security scan produced 0 errors and 1 warning for root README baseline copy owned by Submission Package.
- Final QA lane `git diff --check` passed.
- Final QA lane localhost smoke passed for:
  - Factory API `http://127.0.0.1:8787/health` with HTTP 200 and `syntheticDataOnly: true`.
  - Factory Console `http://127.0.0.1:5173/` with HTTP 200 and expected source markers.
  - Customer360 dashboard `http://127.0.0.1:5174/` with HTTP 200 and expected source markers.

## Manual Smoke Target

- Browser-verify Factory Console local or hosted preview.
- Browser-verify Customer360 dashboard local or hosted preview.
- Run `npm run smoke:demo`.
- Demonstrate sandbox `/deploy` path or documented preview deployment.
- Rehearse canonical request-to-deployment story.
- Confirm README/demo script/Devpost copy match the actual working state; Final QA scan currently warns on root README stale baseline copy until Submission Package lands.
