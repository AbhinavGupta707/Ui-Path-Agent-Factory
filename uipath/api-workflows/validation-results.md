# API Workflow Validation Results

Status: all Checkpoint 4 Agents/API Workflow lane workflow JSON files validated
successfully with the UiPath CLI.

## Discovery Basis

- `uip login status --output json` succeeded for `galacticus / DefaultTenant`.
- `uip agent list --output json` returned no live agent solutions.
- `uip is connections list --output json` returned no Integration Service
  connections.
- `uip is activities list uipath-uipath-http --output json` confirmed the HTTP
  Request activity.
- `uip api-workflow registry resolve "http-request" --output json` resolved
  `uiPathActivityTypeId` `5c4cc855-b42a-37e6-b910-de8588998fce`.

## Validated Files

| Workflow | Validation result |
|---|---|
| `AgentFactory_StartBuildWorker/Workflow.json` | `Status: "Valid"` |
| `AgentFactory_FetchBuildStatus/Workflow.json` | `Status: "Valid"` |
| `AgentFactory_PostStatusUpdate/Workflow.json` | `Status: "Valid"` |
| `AgentFactory_RecordTestResult/Workflow.json` | `Status: "Valid"` |
| `AgentFactory_StartDeployment/Workflow.json` | `Status: "Valid"` |

## Commands

```bash
uip api-workflow validate uipath/api-workflows/AgentFactory_StartBuildWorker/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_FetchBuildStatus/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_PostStatusUpdate/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_RecordTestResult/Workflow.json --output json
uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json
```

No `uip api-workflow run` command was executed. Runtime calls require explicit
approval because they can invoke local or live HTTP endpoints.
