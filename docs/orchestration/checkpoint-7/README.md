# Checkpoint 7: Live Maestro Product Loop

Goal: make Agent Factory work like a live Track 2 UiPath AgentHack product, not a seeded walkthrough.

## Product Outcome

- User submits a request from the premium Factory Console.
- Clarifying questions are generated after submission.
- Build plan, governance, approval, manifest, build, test, deployment, and audit state come from lifecycle APIs.
- Codex performs bounded live build work when enabled, or reports a clear blocked state.
- UiPath Maestro BPMN runs as the Automation Cloud orchestration spine, after explicit approval.
- UiPath API Workflow, Action Center, Data Service, and Test Manager/Test Cloud provide practical live evidence where activated.
- The UI remains simple and polished; evidence is available in drawers/details.

## Base State

Current integration branch: `main`.

Checkpoint 6 final commit: `5ade6e9`.

Initial Checkpoint 7 planning commit: `1166e3a` (`Prepare checkpoint 7 live product loop`).

This pass updates the checkpoint with Devpost-aligned Track 2 Maestro requirements. Start worker lanes only after this requirements update lands and the user approves execution.

## Non-Goals

- No production deployment.
- No raw secrets in UI, docs, logs, traces, or git.
- No live UiPath mutations without explicit approval for the exact action.
- No claim that proposal-only UiPath assets are already running.
- No fallback to "one proof point" if a live Maestro BPMN path is achievable.
- No arbitrary production-data ingestion; uploads are schema/sample/synthetic only.
- Do not reuse superseded scratch worktrees under `/private/tmp/agent-factory-cp5`.

## Lanes

### 1. Agent Graph And Clarification

Deliver:

- provider-backed clarification generation after request submit,
- graph-shaped lifecycle state for clarify, spec, govern, plan,
- deterministic fallback labeled honestly,
- shared contract updates for agent traces and clarification metadata,
- tests for live/degraded/no-key/provider-error behavior.

Primary paths:

- `services/factory-api/src/*`
- `packages/shared-contracts/src/*`
- `services/factory-api/test/*`
- provider/runtime docs as needed

### 2. Product UI Live Flow

Deliver:

- Factory Console matching `Ui References/` more closely,
- request-first flow instead of preloaded proof-board state,
- generated questions shown only after submit,
- API client for full lifecycle endpoints,
- live timeline/build/deploy polling,
- Maestro/API Workflow/Action Center evidence presented as the orchestration spine rather than a side panel,
- evidence drawer for technical detail.

Primary paths:

- `apps/factory-console/src/App.tsx`
- `apps/factory-console/src/factoryClient.ts`
- `apps/factory-console/src/styles.css`
- new `apps/factory-console/src/components/*` if useful

### 3. Codex Worker Live Execution

Deliver:

- safe `BUILD_WORKER_CODEX_ENABLED=true` live-run profile,
- readiness event visible through Build Worker status,
- captured Codex JSONL/SDK events,
- changed-file evidence and forbidden-file enforcement,
- blocked/error states that are clear in API and UI.

Primary paths:

- `services/build-worker/src/codex/*`
- `services/build-worker/src/runtime.ts`
- `services/build-worker/test/*`
- `docs/build-worker.md`

### 4. Maestro Cloud Orchestration

Deliver:

- approved live Maestro BPMN publish/run path against reachable Factory API or Build Worker callbacks,
- hosted/tunnel runbook for UiPath Automation Cloud callbacks,
- API Workflow route that calls Factory API or Build Worker,
- visible human gate through Action Center where practical,
- record of Maestro run, task, workflow, Data Service, and test ids in the Factory API timeline where available,
- updated component map and live demo wording aligned to Track 2.

Primary paths:

- `uipath/maestro/*`
- `uipath/api-workflows/*`
- `uipath/action-center/*`
- `uipath/data-service/*`
- `uipath/test-manager/*`
- `docs/uipath-setup.md`
- `docs/maestro-bpmn.md`
- `docs/api-workflow-contract.md`
- `docs/deployment.md`
- scripts only if needed for hosted/tunnel setup

### 5. QA, Evidence, And Submission Runbook

Deliver:

- full integration checks,
- local and live-proof manual test script,
- updated `docs/live-demo-runbook.md`,
- updated `docs/submission-checklist.md`,
- screenshots/evidence instructions,
- final truth table.

Primary paths:

- `docs/live-demo-runbook.md`
- `docs/submission-checklist.md`
- `docs/component-map.md`
- `docs/orchestration/checkpoint-7/status.md`
- smoke scripts if needed

## Merge Order

1. Agent Graph And Clarification
2. Codex Worker Live Execution
3. Product UI Live Flow
4. Maestro Cloud Orchestration
5. QA, Evidence, And Submission Runbook

## Verification Target

Run after all lanes land:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

Use browser or Chrome verification for laptop widths around `1280`, `1440`, and `1920`. Mobile should not be broken, but laptop demo quality is the priority.

Final QA must verify Devpost alignment: Track 2 Maestro BPMN, working prototype, end-to-end flow, agents involved, UiPath orchestration, human handoff, Codex/coding-agent evidence, and honest live/local/import-ready labels.

## Approval Boundaries

Checkpoint workers may implement code, docs, tests, and local no-secret checks.

The orchestrator must get explicit user approval before:

- live UiPath API Workflow execution,
- Action Center task creation/completion,
- Data Service schema/record creation,
- Maestro publish/run,
- Agent upload/deploy/run,
- Test Cloud execution,
- public hosting with user secrets,
- production release,
- live Codex execution if it could consume paid or account-bound resources beyond local dry checks.
