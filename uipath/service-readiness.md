# UiPath Service Readiness

Primary organization:

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Orchestrator folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Confirmed

- Orchestrator folder access: `uip or folders get AgentFactoryDemo --output json` succeeded.
- Maestro / Process Orchestration: `uip maestro bpmn processes list --output json` and folder-scoped process list succeeded with no processes yet.
- Agents / Agent Builder: `uip agent list --output json` succeeded with no solutions yet.
- Integration Service: installed `@uipath/integrationservice-tool`; connector and connection list probes succeeded.
- Data Service / Data Fabric: `uip df entities list --native-only --output json` succeeded with no entities yet.
- Action Center: `uip tasks list --folder-id 7986306 --limit 1 --output json` succeeded with no tasks yet.
- Test Manager / Test Cloud: installed `@uipath/test-manager-tool`; `uip tm project list --limit 1 --output json` succeeded with no projects yet.
- Apps: Automation Cloud portal search returns `Apps` as a page result: "Low-code web based tool for building and deploying automation-powered business applications." No Apps CLI tool is registered or discoverable.

## Notes

- GitHub Integration Service connector discovery returns `GitHub` with key `uipath-microsoft-github`, but no connection is configured yet.
- No Data Fabric entities, Action Center tasks, Maestro processes, Agent solutions, or Test Manager projects exist yet. That is expected at this stage.
- Use CLI first where coverage exists. Use the Automation Cloud portal when a service is enabled through the UI or the CLI lacks a direct discovery command.

## Checkpoint 1 Mapping Status

- Current implementation mode: `local-simulated` for request lifecycle execution.
- Target platform mode for Checkpoint 4: `uipath-ready` before creation, then `uipath-live` only after the assets exist in Automation Cloud.
- The docs under `docs/` and `uipath/` define planned platform assets. They are not exports from live-created Maestro, Data Service, Action Center, API Workflow, Test Manager, or Apps objects yet.
