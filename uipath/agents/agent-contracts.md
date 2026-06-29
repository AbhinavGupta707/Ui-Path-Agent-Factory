# Agent Builder Contracts

Status: `uipath-ready` low-code Agent Builder solution, scaffolded locally and
validated with `uip agent validate`. No agents were uploaded, published,
deployed, or run in UiPath Automation Cloud.

## Verified Folder

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Local Solution

The import-ready low-code solution lives at:

- `uipath/agents/AgentFactoryAgents/AgentFactoryAgents.uipx`

Projects registered in the solution:

| Agent | Project path | Validation |
|---|---|---|
| Requirements Agent | `AgentFactoryAgents/RequirementsAgent/project.uiproj` | Valid |
| Clarification Agent | `AgentFactoryAgents/ClarificationAgent/project.uiproj` | Valid |
| Governance Agent | `AgentFactoryAgents/GovernanceAgent/project.uiproj` | Valid |
| Build Planner Agent | `AgentFactoryAgents/BuildPlannerAgent/project.uiproj` | Valid |
| Test Summary Agent | `AgentFactoryAgents/TestSummaryAgent/project.uiproj` | Valid |

All five agents use deterministic `temperature: 0`, `mode: "standard"`,
`engine: "basic-v2"`, and scoped Customer360 JSON-only prompts. They do not
declare external tools or Integration Service connections.

## Requirements Agent

Purpose: convert intake into a structured request and identify missing fields.

Inputs:

- `AutomationRequest`
- Intake `sourceSystems` and `constraints`
- Existing clarification answers, if any

Output shape, configured in
`uipath/agents/AgentFactoryAgents/RequirementsAgent/agent.json`:

```json
{
  "requestId": "req_123",
  "objective": "Build a Customer360 dashboard for renewal-risk review.",
  "templateId": "customer360_dashboard_v1",
  "outputType": "dashboard_app",
  "dataSourcesJson": ["CRM", "Product analytics"],
  "metricsJson": ["revenue", "churn_risk_proxy"],
  "filtersJson": ["date_range", "segment"],
  "acceptanceCriteriaJson": ["Dashboard builds", "Risk accounts are visible"],
  "governanceNotesJson": ["Do not expose personal contact fields."],
  "clarificationQuestionsJson": []
}
```

Validation:

- `objective` must be at least 12 characters.
- `acceptanceCriteriaJson` must be non-empty.
- Data sources must come from intake or clarification answers.
- `templateId` and `outputType` must stay Customer360-scoped.

## Clarification Agent

Purpose: produce deterministic clarification questions when the Requirements
Agent cannot produce a complete `StructuredSpec`.

Inputs:

- Partial `StructuredSpec`
- Intake fields
- Governance notes

Output shape, configured in
`uipath/agents/AgentFactoryAgents/ClarificationAgent/agent.json`:

```json
{
  "requestId": "req_123",
  "questionsJson": [
    {
      "id": "clarify_data_scope",
      "question": "Which CRM account fields may the generated dashboard use?",
      "required": true,
      "answerType": "text",
      "default": "Mask customer names, emails, and phone numbers"
    }
  ],
  "routingStatus": "clarifying",
  "auditSummary": "Generated one required data-scope question."
}
```

Routing:

- If questions exist, Maestro keeps the request at `clarifying`.
- Answers update `StructuredSpec.clarificationAnswersJson`.

## Governance Agent

Purpose: evaluate risk, permissions, blockers, and approval requirements.

Inputs:

- `AutomationRequest`
- `StructuredSpec`
- Approved data constraints

Output shape aligned to `GovernanceAssessment`, configured in
`uipath/agents/AgentFactoryAgents/GovernanceAgent/agent.json`:

```json
{
  "requestId": "req_123",
  "riskTier": "medium",
  "piiDetected": true,
  "requiresHumanApproval": true,
  "requiredPermissionsJson": ["read:crm_accounts", "read:product_usage"],
  "blockersJson": [],
  "requiredApprovalsJson": ["scope_data_approval", "release_approval"],
  "policySummary": "Medium risk because CRM and product usage data are combined.",
  "auditSummary": "Governance classified req_123 as medium risk."
}
```

Routing:

- Any blocker routes to rejection or changes requested.
- `requiresHumanApproval = true` creates scope approval.
- Low-risk requests with no blockers may continue to build planning.

## Build Planner Agent

Purpose: turn an approved spec into a constrained `BuildManifest`.

Inputs:

- `AutomationRequest`
- `StructuredSpec`
- `GovernanceAssessment`
- Scope approval decision, if required

Output shape, configured in
`uipath/agents/AgentFactoryAgents/BuildPlannerAgent/agent.json`:

```json
{
  "requestId": "req_123",
  "manifestId": "MAN-req_123",
  "template": "customer360-dashboard",
  "templateId": "customer360_dashboard_v1",
  "artifactType": "dashboard_app",
  "branchName": "factory/req-123",
  "outputApp": "apps/customer360-template",
  "acceptanceCriteriaJson": ["Dashboard builds", "Risk accounts are visible"],
  "permissionsJson": ["read:crm_accounts", "read:product_usage"],
  "allowedFilesJson": ["src/**", "tests/**", "public/data/**", "README.md", "deployment.json", "package.json"],
  "maxRepairAttempts": 1,
  "sandboxOnly": true,
  "codexModel": "gpt-5.5",
  "auditSummary": "Created sandbox Customer360 build manifest."
}
```

Validation:

- `template` must be `customer360-dashboard`.
- `templateId` must be `customer360_dashboard_v1`.
- `acceptanceCriteriaJson` must be non-empty.
- Permissions must be no broader than the approved governance payload.

## Test Summary Agent

Purpose: summarize test evidence for release approval.

Inputs:

- `BuildRun`
- `TestRun`
- Worker logs and test URLs

Output shape, configured in
`uipath/agents/AgentFactoryAgents/TestSummaryAgent/agent.json`:

```json
{
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "testRunId": "test_req_123_001",
  "qualityGateDecision": "passed",
  "summary": "Required gates passed.",
  "checksJson": ["npm run smoke passed"],
  "releaseRisksJson": [],
  "waiversRequestedJson": [],
  "nextStatus": "awaiting_release_approval",
  "auditSummary": "Quality gate passed for req_123."
}
```

Routing:

- Passed gates route to release approval.
- Failed gates route to remediation.
- Waivers must be explicitly visible in release approval.

## Agent Guardrails

- Agents produce structured JSON only.
- Agents do not call external services directly in Checkpoint 4 unless routed
  through Maestro/API Workflow.
- Agents must not invent tenant, folder, or credential facts.
- Agents must preserve the verified folder key and folder id.
- Agents must write audit-friendly summaries without secrets.
- Agents are scoped to `customer360_dashboard_v1` and sandbox-only output.
- Agent projects contain no Integration Service connection IDs.

## Validation Commands

```bash
uip agent validate uipath/agents/AgentFactoryAgents/RequirementsAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/ClarificationAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/GovernanceAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/BuildPlannerAgent --output json
uip agent validate uipath/agents/AgentFactoryAgents/TestSummaryAgent --output json
```

Each command returned `Result: "Success"`, `Status: "Valid"`,
`StorageVersion: "50.0.0"`, and `MigrationPending: false`.
