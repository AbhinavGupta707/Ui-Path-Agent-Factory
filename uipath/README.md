# UiPath Assets

This directory contains source-controlled implementation guidance for the UiPath
platform layer of the Governed Agentic Automation Factory.

Checkpoint 1 is local-first. The Factory API and Factory Console run locally,
while the UiPath assets below are mapped precisely enough for Checkpoint 4 to
create them in Automation Cloud without repeating discovery.

## Verified Automation Cloud Context

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Orchestrator folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Asset Status

| Area | Source file | Current status |
|---|---|---|
| Service readiness | `service-readiness.md` | Verified tenant/folder and CLI discovery facts |
| Maestro | `maestro/bpmn-export-or-notes.md`, `maestro/process-contract.json` | Planned BPMN implementation contract |
| Agents | `agents/agent-contracts.md` | Planned Agent Builder contracts |
| Action Center | `action-center/approval-contracts.md` | Planned approval payloads and outcomes |
| Data Service | `data-service/schema.json` | Planned entity schema aligned to shared contracts |
| API Workflows | `api-workflows/contracts.md` | Planned workflow call contracts |
| Test Manager/Test Cloud | `test-cloud/test-plan.md` | Planned quality gate mapping |
| UiPath Apps | `apps/companion-app.md` | Planned companion intake/status surface |

Generated local skill bundles, credentials, `.env` values, `.uipath/.skills`,
and `.agents/skills` must stay out of git.
