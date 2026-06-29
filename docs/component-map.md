# Component Map

This map helps judges and reviewers understand what each part does, where it lives, and whether it is live, local, import-ready, or proposal-only.

## Product Components

| Component | Path | Role | Current status |
|---|---|---|---|
| Factory Console | `apps/factory-console` | Primary polished operator UI for intake, governance, manifest, quality, deployment, and audit. | Runnable locally. |
| Factory API | `services/factory-api` | Local lifecycle API and in-memory state shaped for Data Service. | Runnable locally on port `8787`. |
| Build Worker | `services/build-worker` | Receives governed manifests, validates worker contract, records build/test/artifact status. | Runnable locally on port `8790`; default runner blocks without injected Codex/Git execution. |
| Customer360 dashboard | `apps/customer360-template` | Generated-dashboard target and demo artifact. | Runnable locally on port `5174`. |
| Shared contracts | `packages/shared-contracts` | Lifecycle schemas and runtime contract types. | Built/tested locally. |
| Customer360 metrics | `packages/customer360-metrics` | Synthetic dataset metrics, mutation, and PII checks. | Built/tested locally. |
| Data mutation helper | `scripts/mutate-customer360-data.mjs` | Writes untracked Customer360 mutation evidence for refresh/deployment lanes. | Runnable locally. |

## UiPath Components

| UiPath area | Path | Product role | Current status | Approval boundary |
|---|---|---|---|---|
| Orchestrator | `docs/uipath-setup.md` | Folder, runtime, assets, and credential control. | Folder `AgentFactoryDemo` is live. | Jobs/assets/process mutations require approval. |
| Maestro BPMN | `uipath/maestro/customer360-build` | Main lifecycle orchestration. | Validated and import-ready; not published or run. | Publish/run requires approval. |
| Data Service | `uipath/data-service/schema.json` | Proposed system of record for request/spec/approvals/build/test/deploy/audit. | Proposal-only. | Schema and record creation require approval. |
| Agents | `uipath/agents/AgentFactoryAgents` | Requirements, Clarification, Governance, Build Planner, Test Summary. | Five projects validate locally; not uploaded. | Upload/publish/deploy/run requires approval. |
| API Workflows | `uipath/api-workflows` | Calls Build Worker, polls status, records tests, starts deployment. | Five workflows validate locally; not run. | Runtime calls and uploads require approval. |
| Action Center | `uipath/action-center` | Scope/data and release approval contracts. | Proposal-only; no tasks exist. | Task creation/completion requires approval. |
| UiPath Apps | `uipath/apps` | Companion intake/status surface. | Proposal-only; no app created or deployed. | Pack/publish/deploy requires approval. |
| Test Manager/Test Cloud | `uipath/test-cloud`, `docs/test-cloud-quality-gates.md` | Release quality-gate catalog. | Live project, test set, and seven test cases; no execution. | Live execution requires approval. |
| Integration Service | `docs/api-workflow-contract.md` | HTTP connector for workflow calls; future GitHub connection. | Connector discovered; no connections configured. | OAuth/connection setup requires approval. |
| UiPath for Coding Agents | `docs/setup.md`, `docs/uipath-setup.md` | Local Codex skills path. | Setup command documented. | Generated skill bundles must stay out of git. |

## End-To-End State Mapping

| Demo step | Local implementation | UiPath mapping | Current truth |
|---|---|---|---|
| Intake | Factory Console and `POST /api/requests` or `POST /api/intake` | UiPath Apps + Maestro start event | Local runnable; UiPath Apps proposal-only |
| Clarification | Deterministic API questions and console state | Requirements + Clarification Agents | Local runnable; Agents validate locally |
| Governance | Governance assessment, PII policy, forbidden actions | Governance Agent + Data Service | Local runnable; Data Service proposal-only |
| Scope approval | `POST /approve-scope` and approval panel | Action Center scope/data task | Local runnable; live task not created |
| Manifest | `POST /manifest` | Build Planner Agent + Data Service record | Local runnable; Agent validates locally |
| Build worker | `POST /api/builds`, Build Worker `/build` | API Workflow `AgentFactory_StartBuildWorker` | API runnable; workflow import-ready |
| Tests | `npm run smoke`, workspace tests, Customer360/build-worker smokes | Test Manager/Test Cloud release gate | Local runnable; Test Manager catalog live |
| Release approval | Release approval contract and demo panel | Action Center release task | Contract proposal-only |
| Deployment | Customer360 local dashboard, future sandbox handoff | API Workflow `AgentFactory_StartDeployment` | Local dashboard runnable; `/deploy` endpoint pending |
| Audit | Factory API timeline | Data Service `AuditEvent` + Maestro closeout | Local runnable; Data Service proposal-only |

## Evidence Commands

```bash
npm run smoke
npm run smoke:customer360
npm run smoke:build-worker
uip login status --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

## Known Integration Notes

- Final QA may add `npm run smoke:demo`; this docs lane did not add scripts.
- Deployment/Runtime may add the `/deploy` endpoint or hosted preview commands; update README, setup, demo script, Devpost copy, component map, and checklist when that lands.
- Do not copy from superseded scratch worktrees under `/private/tmp/agent-factory-cp5`.
