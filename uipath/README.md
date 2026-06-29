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
