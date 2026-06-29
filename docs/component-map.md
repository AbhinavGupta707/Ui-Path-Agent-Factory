# Component Map

This map helps judges and reviewers understand what each part does, where it lives, and whether it is live, local, import-ready, or proposal-only.

## Product Components

| Component | Path | Role | Current status |
|---|---|---|---|
| Factory Console | `apps/factory-console` | Primary polished operator UI for intake, governance, manifest, quality, deployment, and audit. | Runnable locally. |
| Factory API | `services/factory-api` | Local lifecycle API, UiPath live-evidence callback receiver, and in-memory state shaped for Data Service. | Preferred `dev:live` port `8887`; legacy service default `8787`. |
| Build Worker | `services/build-worker` | Receives governed manifests, validates worker contract, records build/test/artifact status. | Preferred `dev:live` port `8890`; legacy service default `8790`; default runner blocks without injected Codex/Git execution. |
| Customer360 dashboard | `apps/customer360-template` | Generated-dashboard target and demo artifact. | Preferred `dev:live` port `5184`; package dev default `5174`. |
| Shared contracts | `packages/shared-contracts` | Lifecycle schemas and runtime contract types. | Built/tested locally. |
| Customer360 metrics | `packages/customer360-metrics` | Synthetic dataset metrics, mutation, and PII checks. | Built/tested locally. |
| Data mutation helper | `scripts/mutate-customer360-data.mjs` | Writes untracked Customer360 mutation evidence for refresh/deployment lanes. | Runnable locally. |
| Live setup helper | `scripts/setup-live-env.mjs` | Prompts for local provider/runtime configuration and writes git-ignored local values. | Runnable locally; no values committed. |
| Live stack launcher | `scripts/dev-live.mjs` | Starts the Checkpoint 7 local API, worker, Factory Console, and Customer360 stack with one command. | Runnable locally on configured ports. |
| UiPath live spine helper | `scripts/uipath-live-spine.mjs` | Prints exact approval-gated Maestro/API Workflow activation commands and runs safe readiness checks. | Runnable locally; live mutations require explicit `AGENT_FACTORY_APPROVE_UIPATH_LIVE=true`. |
| Demo smoke | `scripts/smoke-demo.mjs` | Runs the local no-secret demo verification bundle. | Runnable locally without UiPath mutations or provider calls. |

## UiPath Components

| UiPath area | Path | Product role | Current status | Approval boundary |
|---|---|---|---|---|
| Orchestrator | `docs/uipath-setup.md` | Folder, runtime, assets, and credential control. | Folder `AgentFactoryDemo` is live. | Jobs/assets/process mutations require approval. |
| Maestro BPMN | `uipath/maestro/customer360-build` | Main Track 2 lifecycle orchestration. | Validated and import-ready; not published or run; Checkpoint 7 live run requires approved HTTPS callback bridge. | Publish/run requires approval. |
| Data Service | `uipath/data-service/schema.json` | Proposed system of record for request/spec/approvals/build/test/deploy/audit. | Proposal-only. | Schema and record creation require approval. |
| Agents | `uipath/agents/AgentFactoryAgents` | Requirements, Clarification, Governance, Build Planner, Test Summary. | Five projects validate locally; not uploaded. | Upload/publish/deploy/run requires approval. |
| API Workflows | `uipath/api-workflows` | Calls Build Worker, polls status, records tests, starts deployment, and records UiPath live evidence in Factory API. | Six workflows validate locally; not run; live inputs must override local base URLs with approved HTTPS endpoints. | Runtime calls and uploads require approval. |
| Action Center | `uipath/action-center` | Scope/data and release approval contracts. | Proposal-only; no tasks exist. | Task creation/completion requires approval. |
| UiPath Apps | `uipath/apps` | Companion intake/status surface. | Proposal-only; no app created or deployed. | Pack/publish/deploy requires approval. |
| Test Manager/Test Cloud | `uipath/test-cloud`, `docs/test-cloud-quality-gates.md` | Release quality-gate catalog. | Live project, test set, and seven test cases; no execution. | Live execution requires approval. |
| Integration Service | `docs/api-workflow-contract.md` | HTTP connector for workflow calls; future GitHub connection. | Connector discovered; no connections configured. | OAuth/connection setup requires approval. |
| UiPath for Coding Agents | `docs/setup.md`, `docs/uipath-setup.md` | Local Codex skills path. | Setup command documented. | Generated skill bundles must stay out of git. |
| Fireworks provider | `docs/live-agentic-architecture.md`, `docs/live-demo-runbook.md` | Server-side model profiles for coded agent reasoning. | Provider-ready through local/deployment config; no UI claim of direct browser calls. | Provider values and paid calls require owner-approved environment. |
| LangSmith provider | `docs/live-agentic-architecture.md`, `docs/live-demo-runbook.md` | Trace and evaluation evidence for agent runs. | Provider-ready through local/deployment config; not a product state store. | Trace sharing requires sanitized payload review. |

## End-To-End State Mapping

| Demo step | Local implementation | UiPath mapping | Current truth |
|---|---|---|---|
| Intake | Factory Console and `POST /api/requests` or `POST /api/intake` | UiPath Apps + Maestro start event | Local runnable; UiPath Apps proposal-only |
| Clarification | Post-submit agent runtime questions with deterministic/degraded fallback metadata | Requirements + Clarification Agents | Local runnable; provider-ready; Agents validate locally |
| Governance | Governance assessment, PII policy, forbidden actions | Governance Agent + Data Service | Local runnable; Data Service proposal-only |
| Scope approval | `POST /approve-scope` and approval panel | Action Center scope/data task | Local runnable; live task not created |
| Manifest | `POST /manifest` | Build Planner Agent + Data Service record | Local runnable; Agent validates locally |
| Build worker | `POST /api/builds`, Build Worker `/build` | API Workflow `AgentFactory_StartBuildWorker` | API runnable; workflow import-ready |
| Tests | `npm run smoke`, workspace tests, Customer360/build-worker smokes | Test Manager/Test Cloud release gate | Local runnable; Test Manager catalog live |
| Release approval | Release approval contract and demo panel | Action Center release task | Contract proposal-only |
| Deployment | Customer360 local dashboard and Factory API `POST /deploy` sandbox contract | API Workflow `AgentFactory_StartDeployment` | Local dashboard and sandbox evidence endpoint runnable; workflow runtime call approval-gated |
| Audit | Factory API timeline and `POST /api/requests/:id/uipath-event` | API Workflow `AgentFactory_RecordUiPathEvent` + Data Service `AuditEvent` + Maestro closeout | Local runnable; live evidence callback import-ready; Data Service proposal-only |

## Checkpoint 7 Live Evidence IDs

When the live path is approved and executed, preserve these ids in the Factory
API timeline and final demo evidence:

| UiPath evidence | Source |
|---|---|
| Maestro process id and run/process-instance id | `uip maestro bpmn` publish/run output or Maestro portal |
| API Workflow execution id | `uip api-workflow run` output or Automation Cloud workflow execution details |
| Scope/release `actionCenterTaskId` | `uip tasks list/get` after task creation |
| Data Service record ids | `uip df records insert/get/list` after approved writes |
| Test Manager project/test set/test execution ids | `uip tm project/testsets/executions` readouts |

## Evidence Commands

```bash
npm run smoke
npm run smoke:demo
npm run smoke:customer360
npm run smoke:build-worker
npm run uipath:live-plan
npm run uipath:readiness
uip login status --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

## Known Integration Notes

- Checkpoint 7 Final QA verified `npm run smoke:demo` after the implementation merges.
- Deployment/Runtime added the sandbox `/deploy` endpoint and local dry-run command; hosted production deployment still requires explicit approval.
- Do not copy from superseded scratch worktrees under `/private/tmp/agent-factory-cp5`.
