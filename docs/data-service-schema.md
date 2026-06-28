# Data Service Schema Mapping

This is the planned Data Service schema for Checkpoint 4. No Data Service
entities exist yet in the verified tenant.

## Environment

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Planned namespace | `AgentFactory` |

## Design Rules

- Keep `requestId` as the correlation key across every entity.
- Store arrays and complex agent outputs as JSON text fields where Data Service
  does not provide a native array or object shape.
- Preserve external system IDs separately from display names.
- Do not store local `.env` values, access tokens, cookies, or private keys.
- Use `platformMode` to distinguish `local-simulated`, `uipath-ready`, and
  `uipath-live` records.
- Treat the TypeScript schemas in `packages/shared-contracts/src/index.ts` as
  the Checkpoint 1 source of truth for field names and enum values.

## Entities

### AutomationRequest

Primary lifecycle record aligned to `AutomationRequest`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `requestId` | Text | Yes | Unique, mirrors local `req_*` id |
| `title` | Text | Yes | Intake title |
| `requesterEmail` | Text | Yes | Business requester email |
| `businessGoal` | Long Text | Yes | Intake business goal |
| `targetAudience` | Text | Yes | Intended users |
| `dueDate` | Date | No | Optional intake due date |
| `sourceSystemsJson` | Long Text | Yes | JSON array from `sourceSystems` |
| `constraintsJson` | Long Text | Yes | JSON array from `constraints` |
| `status` | Choice | Yes | Values from `automationRequestStatuses` |
| `platformMode` | Choice | Yes | `local-simulated`, `uipath-ready`, `uipath-live` |
| `folderName` | Text | Yes | `AgentFactoryDemo` |
| `folderKey` | Text | Yes | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| `folderId` | Number | Yes | `7986306` |
| `currentApprovalId` | Text | No | Latest `ApprovalTask.approvalId` |
| `currentBuildRunId` | Text | No | Latest `BuildRun.buildRunId` |
| `createdAt` | DateTime | Yes | ISO timestamp from local/API workflow |
| `updatedAt` | DateTime | Yes | Updated on every state transition |

Choice values for `status`:

- `draft`
- `clarifying`
- `awaiting_scope_approval`
- `approved_for_build`
- `manifest_created`
- `build_queued`
- `building`
- `build_failed`
- `tests_running`
- `tests_failed`
- `awaiting_release_approval`
- `deploying`
- `deployed`
- `blocked`
- `cancelled`

### StructuredSpec

Agent-normalized requirements aligned to `StructuredSpec`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `specId` | Text | Yes | Unique spec id |
| `requestId` | Text | Yes | Correlation key |
| `objective` | Long Text | Yes | Normalized objective |
| `requiredCapabilitiesJson` | Long Text | Yes | JSON array |
| `dataSourcesJson` | Long Text | Yes | JSON array |
| `acceptanceCriteriaJson` | Long Text | Yes | JSON array |
| `governanceNotesJson` | Long Text | Yes | JSON array |
| `clarificationQuestionsJson` | Long Text | No | Open questions for user |
| `clarificationAnswersJson` | Long Text | No | User responses |
| `agentVersion` | Text | No | Agent solution/version identifier |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

### GovernanceAssessment

Risk and permission assessment aligned to `GovernanceAssessment`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `assessmentId` | Text | Yes | Unique assessment id |
| `requestId` | Text | Yes | Correlation key |
| `riskLevel` | Choice | Yes | `low`, `medium`, `high` |
| `requiresHumanApproval` | Boolean | Yes | Drives scope approval gateway |
| `requiredPermissionsJson` | Long Text | Yes | JSON array |
| `blockersJson` | Long Text | Yes | JSON array |
| `policySummary` | Long Text | Yes | Human-readable governance summary |
| `createdAt` | DateTime | Yes | Creation timestamp |

### ApprovalTask

Action Center task mirror.

| Field | Type | Required | Notes |
|---|---|---|---|
| `approvalId` | Text | Yes | Internal approval correlation id |
| `requestId` | Text | Yes | Correlation key |
| `approvalType` | Choice | Yes | `scope` or `release` |
| `actionCenterTaskId` | Text | No | Live task id after creation |
| `title` | Text | Yes | Task title |
| `status` | Choice | Yes | `pending`, `approved`, `rejected`, `changes_requested`, `cancelled`, `expired` |
| `payloadJson` | Long Text | Yes | Task input payload |
| `decisionJson` | Long Text | No | Approver decision and notes |
| `requestedBy` | Text | Yes | Usually `maestro` |
| `assignedTo` | Text | No | Approver or group |
| `decidedBy` | Text | No | User who completed task |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `decidedAt` | DateTime | No | Decision timestamp |

### BuildManifest

Build worker instruction record aligned to `BuildManifest`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `manifestId` | Text | Yes | Unique manifest id |
| `requestId` | Text | Yes | Correlation key |
| `template` | Text | Yes | Must be `customer360-dashboard` in Checkpoint 1 |
| `branchName` | Text | Yes | Planned worker branch |
| `outputApp` | Text | Yes | Example `apps/customer360-template` |
| `acceptanceCriteriaJson` | Long Text | Yes | JSON array |
| `permissionsJson` | Long Text | Yes | JSON array |
| `codexModel` | Text | Yes | Default `gpt-5.5` per shared contract |
| `manifestJson` | Long Text | Yes | Full manifest snapshot |
| `createdAt` | DateTime | Yes | Creation timestamp |

### BuildRun

Build execution mirror aligned to `BuildRun`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `buildRunId` | Text | Yes | Unique build run id |
| `requestId` | Text | Yes | Correlation key |
| `manifestId` | Text | Yes | Related manifest |
| `status` | Choice | Yes | `queued`, `running`, `passed`, `failed` |
| `workerMode` | Choice | Yes | `scaffold`, `codex-local`, `codex-live` |
| `workerEndpoint` | Text | No | Build worker endpoint name or URL |
| `startedAt` | DateTime | No | Start timestamp |
| `finishedAt` | DateTime | No | Finish timestamp |
| `lastHeartbeatAt` | DateTime | No | Callback heartbeat |
| `logsUrl` | Text | No | Build logs |
| `pullRequestUrl` | Text | No | GitHub PR |
| `deploymentUrl` | Text | No | Deployment artifact |
| `errorSummary` | Long Text | No | Terminal error summary |

### TestRun

Quality gate evidence.

| Field | Type | Required | Notes |
|---|---|---|---|
| `testRunId` | Text | Yes | Unique test run id |
| `requestId` | Text | Yes | Correlation key |
| `buildRunId` | Text | Yes | Related build |
| `status` | Choice | Yes | `queued`, `running`, `passed`, `failed`, `blocked` |
| `testManagerProjectId` | Text | No | Live Test Manager project id after Checkpoint 4 |
| `testSetId` | Text | No | Live test set id after Checkpoint 4 |
| `automatedResultsUrl` | Text | No | CI/Test Cloud report URL |
| `smokeResult` | Choice | Yes | `not_run`, `passed`, `failed` |
| `securityReviewResult` | Choice | Yes | `not_run`, `passed`, `failed`, `waived` |
| `accessibilityResult` | Choice | Yes | `not_run`, `passed`, `failed`, `waived` |
| `qualityGateDecision` | Choice | Yes | `pending`, `passed`, `failed`, `waived` |
| `notes` | Long Text | No | Test summary |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `completedAt` | DateTime | No | Completion timestamp |

### DeploymentRecord

Release artifact evidence.

| Field | Type | Required | Notes |
|---|---|---|---|
| `deploymentId` | Text | Yes | Unique deployment id |
| `requestId` | Text | Yes | Correlation key |
| `buildRunId` | Text | Yes | Related build |
| `status` | Choice | Yes | `pending`, `deployed`, `rolled_back`, `failed` |
| `environment` | Text | Yes | `sandbox` for hackathon demo |
| `deploymentUrl` | Text | No | Public artifact URL |
| `releasedBy` | Text | No | Release approver |
| `releasedAt` | DateTime | No | Release timestamp |
| `rollbackNotes` | Long Text | No | Rollback or disable instructions |

### AuditEvent

Append-only audit record aligned to `AuditEvent`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `auditEventId` | Text | Yes | Unique audit id |
| `requestId` | Text | Yes | Correlation key |
| `actor` | Text | Yes | Example `factory-api`, `maestro`, `governance-agent` |
| `action` | Text | Yes | Controlled action string |
| `summary` | Long Text | Yes | Human-readable summary |
| `payloadJson` | Long Text | No | Structured details |
| `createdAt` | DateTime | Yes | Event timestamp |

## Relationships

| Parent | Child | Cardinality |
|---|---|---|
| `AutomationRequest.requestId` | `StructuredSpec.requestId` | One to many over revisions |
| `AutomationRequest.requestId` | `GovernanceAssessment.requestId` | One to many over revisions |
| `AutomationRequest.requestId` | `ApprovalTask.requestId` | One to many |
| `AutomationRequest.requestId` | `BuildManifest.requestId` | One to many over rebuilds |
| `BuildManifest.manifestId` | `BuildRun.manifestId` | One to many |
| `BuildRun.buildRunId` | `TestRun.buildRunId` | One to many |
| `BuildRun.buildRunId` | `DeploymentRecord.buildRunId` | One to many |
| `AutomationRequest.requestId` | `AuditEvent.requestId` | One to many |

## Required Indexes Or Lookups

- `AutomationRequest.requestId`
- `AutomationRequest.status`
- `AutomationRequest.requesterEmail`
- `ApprovalTask.requestId`
- `ApprovalTask.status`
- `BuildRun.requestId`
- `TestRun.requestId`
- `DeploymentRecord.requestId`
- `AuditEvent.requestId`
- `AuditEvent.createdAt`

## Checkpoint 4 Validation

After creating entities, run one seeded request and confirm:

1. An `AutomationRequest` record exists with the verified folder facts.
2. Each state transition updates `AutomationRequest.status`.
3. Each Agent, Action Center, API Workflow, build, test, deployment, and failure path writes an `AuditEvent`.
4. No credential or `.env` values appear in any Data Service record.
