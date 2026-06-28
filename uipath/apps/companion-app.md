# UiPath Apps Companion Surface

Status: planned app, not live-created.

The custom Factory Console remains the polished primary demo UI. UiPath Apps is
the enterprise companion surface that proves the lifecycle is available inside
the UiPath platform.

## Planned App

- App name: `Agent Factory Intake Companion`
- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `AgentFactoryDemo`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Folder id: `7986306`

## Role In The Product

| Surface | Role |
|---|---|
| Factory Console | Primary polished intake, status, manifest, approval, and audit experience |
| UiPath Apps | Official UiPath companion for intake and status mirroring |
| Action Center | Human decision tasks |
| Maestro | Lifecycle orchestration source of truth |
| Data Service | Shared state for both UI surfaces |

## Screens

### Intake

Fields:

- `title`
- `requesterEmail`
- `businessGoal`
- `targetAudience`
- `dueDate`
- `sourceSystems`
- `constraints`

Action:

- Create `AutomationRequest` in Data Service or call the local/hosted Factory API
  through an API Workflow.
- Set initial status to `needs_clarification` after submission.

### Request Status

Display:

- Request title
- Current status
- Platform mode
- Latest approval state
- Latest build run state
- Latest test gate decision
- Deployment URL when available
- Audit timeline summary

Data source:

- Data Service `AutomationRequest`
- Related `ApprovalTask`, `BuildRun`, `TestRun`, `DeploymentRecord`, and
  `AuditEvent` records filtered by `requestId`

### Clarifications

Display open questions from `StructuredSpec.clarificationQuestionsJson`.

Action:

- Save answers to `StructuredSpec.clarificationAnswersJson`.
- Notify Maestro to continue the clarification loop.

## Checkpoint 4 Acceptance Criteria

- The app can submit or mirror one Customer360 intake.
- The app can show status for an existing `AutomationRequest`.
- The Factory Console remains the primary UI in the demo narrative.
- The app does not store credentials or secrets.
