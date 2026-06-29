# UiPath Assets

This directory contains the source-controlled UiPath layer for the Governed Agentic Automation Factory. The assets are intentionally explicit about whether they are live, import-ready, validated locally, or proposal-only.

## Verified Automation Cloud Context

| Fact | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Orchestrator folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Isolated solution folder, historical | `AgentFactoryDemoLiveSpine` / `86717885-17bf-4d28-8253-0172c91540ec` / `7989131` |
| Isolated solution folder, current patched candidate | `AgentFactoryDemoLiveSpine 1` / `d991e64c-d0ad-4ec6-9798-8783b166a073` / `7989142` |

## Asset Status

| Area | Source file(s) | Current status |
|---|---|---|
| Service readiness | `service-readiness.md`, `../docs/uipath-setup.md` | Folder and product discovery facts documented; `docs/uipath-setup.md` is the Checkpoint 5 source of truth. |
| Maestro | `maestro/customer360-build/`, `maestro/process-contract.json`, `maestro/bpmn-export-or-notes.md` | BPMN source validates and is solution-deployed live as `1.0.1` in `AgentFactoryDemoLiveSpine 1`; no runtime process instance has been created. |
| Agents | `agents/AgentFactoryAgents/`, `agents/agent-contracts.md` | Five low-code agents validate locally; no upload, publish, deploy, or run has occurred. |
| API Workflows | `api-workflows/*/Workflow.json`, `api-workflows/validation-results.md` | Six workflow definitions validate locally and support optional bridge token headers; no cloud-packaged workflow runtime call is claimed. |
| Action Center | `action-center/approval-contracts.json`, `action-center/approval-contracts.md` | Proposal-only scope and release approval contracts; no live tasks exist. |
| Data Service | `data-service/schema.json` | Proposal-only schema; no choice sets, entities, fields, or records have been created. |
| Test Manager/Test Cloud | `test-cloud/quality-gate-assets.json`, `../docs/test-cloud-quality-gates.md` | Live project, test set, and seven test cases exist; no live execution has been approved or run. |
| UiPath Apps | `apps/companion-app.contract.json`, `apps/companion-app.md` | Proposal-only companion app contract; no app has been created, packed, published, or deployed. |

## Safe Verification

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip tm testsets list --project-key AFQG --output json
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

## Checkpoint 7 Cloud Run Readiness

For the Track 2 Maestro run, keep the checked-in assets local-safe and pass live
endpoints at runtime. Automation Cloud needs HTTPS callback targets for:

- Factory API status/test/deploy callbacks,
- Build Worker build trigger and polling,
- Customer360 sandbox preview URL evidence.

Recommended activation order:

1. Run read-only discovery for login, folder, Maestro/API Workflow/Action
   Center/Data Service/Test Manager surfaces.
2. Start local Factory API, Build Worker, and Customer360 preview, then expose
   only the approved surfaces through an HTTPS tunnel or host.
3. Set `AGENT_FACTORY_BRIDGE_TOKEN` on the trusted bridge host and pass the
   value as API Workflow `bridgeToken`.
4. Override API Workflow inputs with those HTTPS base URLs.
5. Validate local BPMN/API workflow assets.
6. Use the UiPath Solutions lifecycle for Maestro deployment; direct
   `uip maestro bpmn process publish` currently fails with
   `Invalid argument 'Period'`.
7. Request explicit approval for the exact run/task/data/test command.
8. Capture Maestro run id, API Workflow execution id, Action Center task id,
   Data Service record id, and Test Manager/Test Cloud execution id where
   available.

## Approval Boundary

The following are live mutations or side-effecting runtime calls and require explicit approval before use:

- Data Service schema or record creation
- Maestro solution deploy, direct publish, or run
- Agent or solution upload/publish/deploy/run
- API Workflow runtime calls
- Action Center task creation or completion
- UiPath Apps publish or deploy
- Test Manager/Test Cloud execution
- Production deployment

Generated local skill bundles, credentials, `.env` values, `.uipath/.skills`, and `.agents/skills` must stay out of git.
