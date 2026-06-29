# Agent Factory Low-Code Agents

Status: `uipath-ready`, local solution only.

This directory contains the import-ready UiPath low-code agent solution for the
Checkpoint 4 Agents lane:

- `AgentFactoryAgents.uipx`
- `RequirementsAgent`
- `ClarificationAgent`
- `GovernanceAgent`
- `BuildPlannerAgent`
- `TestSummaryAgent`

The projects were scaffolded with `uip agent init`, registered in the local
solution, edited to produce bounded Customer360 JSON outputs, and validated with
`uip agent validate`.

No `uip agent push`, `uip solution upload`, `uip agent publish`, or
`uip agent deploy` command was run. Uploading or deploying these agents needs
explicit approval.

## Validation

All five projects returned `Status: "Valid"` and `MigrationPending: false`:

```bash
uip agent validate uipath/agents/AgentFactoryAgents/RequirementsAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/ClarificationAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/GovernanceAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/BuildPlannerAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/TestSummaryAgent --output json
```

## Runtime Boundaries

- Agents have no external tools or Integration Service resources.
- Agents must not invent connection IDs, folder facts, credentials, or live
  asset IDs.
- Agents are scoped to `customer360_dashboard_v1`, sandbox-only build planning,
  and audit-friendly summaries.
- Maestro should own routing between agents, Action Center approvals, API
  Workflows, and Data Service records.
