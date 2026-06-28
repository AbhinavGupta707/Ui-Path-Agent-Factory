# Agent Builder Contracts

Status: planned Agent Builder contracts, not live-created agent solutions.

## Verified Folder

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Requirements Agent

Purpose: convert intake into a structured request and identify missing fields.

Inputs:

- `AutomationRequest`
- Intake `sourceSystems` and `constraints`
- Existing clarification answers, if any

Output shape:

```json
{
  "requestId": "req_123",
  "objective": "Build a Customer360 dashboard for renewal-risk review.",
  "requiredCapabilities": ["risk scoring", "account summary", "refresh timestamp"],
  "dataSources": ["CRM", "Product analytics"],
  "acceptanceCriteria": ["Dashboard builds", "Risk accounts are visible"],
  "governanceNotes": ["Do not expose personal contact fields."],
  "clarificationQuestions": []
}
```

Validation:

- `objective` must be at least 12 characters.
- `requiredCapabilities` and `acceptanceCriteria` must be non-empty.
- Data sources must come from intake or clarification answers.

## Clarification Agent

Purpose: produce deterministic clarification questions when the Requirements
Agent cannot produce a complete `StructuredSpec`.

Inputs:

- Partial `StructuredSpec`
- Intake fields
- Governance notes

Output shape:

```json
{
  "requestId": "req_123",
  "questions": [
    {
      "id": "clarify_data_scope",
      "question": "Which CRM account fields may the generated dashboard use?",
      "required": true,
      "answerType": "text"
    }
  ]
}
```

Routing:

- If questions exist, Maestro keeps the request at `needs_clarification`.
- Answers update `StructuredSpec.clarificationAnswersJson`.

## Governance Agent

Purpose: evaluate risk, permissions, blockers, and approval requirements.

Inputs:

- `AutomationRequest`
- `StructuredSpec`
- Approved data constraints

Output shape aligned to `GovernanceAssessment`:

```json
{
  "requestId": "req_123",
  "riskLevel": "medium",
  "requiresHumanApproval": true,
  "requiredPermissions": ["read:crm_accounts", "read:product_usage"],
  "blockers": [],
  "policySummary": "Medium risk because CRM and product usage data are combined."
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

Output shape:

```json
{
  "requestId": "req_123",
  "template": "customer360-dashboard",
  "branchName": "factory/req-123",
  "outputApp": "apps/customer360-template",
  "acceptanceCriteria": ["Dashboard builds", "Risk accounts are visible"],
  "permissions": ["read:crm_accounts", "read:product_usage"],
  "codexModel": "gpt-5.5"
}
```

Validation:

- `template` must be `customer360-dashboard`.
- `acceptanceCriteria` must be non-empty.
- Permissions must be no broader than the approved governance payload.

## Test Summary Agent

Purpose: summarize test evidence for release approval.

Inputs:

- `BuildRun`
- `TestRun`
- Worker logs and test URLs

Output shape:

```json
{
  "requestId": "req_123",
  "buildRunId": "build_req_123_001",
  "testRunId": "test_req_123_001",
  "qualityGateDecision": "passed",
  "summary": "Required gates passed.",
  "releaseRisks": [],
  "waiversRequested": []
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
