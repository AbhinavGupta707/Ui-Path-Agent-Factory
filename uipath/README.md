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

## Asset Status

| Area | Source file(s) | Current status |
|---|---|---|
| Service readiness | `service-readiness.md`, `../docs/uipath-setup.md` | Folder and product discovery facts documented; `docs/uipath-setup.md` is the Checkpoint 5 source of truth. |
| Maestro | `maestro/customer360-build/`, `maestro/process-contract.json`, `maestro/bpmn-export-or-notes.md` | BPMN source validates and is import-ready; no process has been published or run. |
| Agents | `agents/AgentFactoryAgents/`, `agents/agent-contracts.md` | Five low-code agents validate locally; no upload, publish, deploy, or run has occurred. |
| API Workflows | `api-workflows/*/Workflow.json`, `api-workflows/validation-results.md` | Five workflow definitions validate locally; no workflow runtime call has been run. |
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
3. Override API Workflow inputs with those HTTPS base URLs.
4. Validate local BPMN/API workflow assets.
5. Request explicit approval for the exact publish/run/task/data/test command.
6. Capture Maestro run id, API Workflow execution id, Action Center task id,
   Data Service record id, and Test Manager/Test Cloud execution id where
   available.

## Approval Boundary

The following are live mutations or side-effecting runtime calls and require explicit approval before use:

- Data Service schema or record creation
- Maestro publish or run
- Agent or solution upload/publish/deploy/run
- API Workflow runtime calls
- Action Center task creation or completion
- UiPath Apps publish or deploy
- Test Manager/Test Cloud execution
- Production deployment

Generated local skill bundles, credentials, `.env` values, `.uipath/.skills`, and `.agents/skills` must stay out of git.
