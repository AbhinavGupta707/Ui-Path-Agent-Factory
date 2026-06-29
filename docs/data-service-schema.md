# Data Service Schema Proposal

Checkpoint 4 status: proposal-only. No Data Service entities, fields, choice
sets, or records were created in Automation Cloud.

The exact proposed schema is rendered in
`uipath/data-service/schema.json`. It is intentionally marked
`proposal-only` because Data Service schema creation is a live schema mutation
and requires explicit approval before running `uip df choice-sets create`,
`uip df choice-set-values create`, `uip df entities create`, or schema-altering
`uip df entities update`.

## Verified Environment

| Field | Value |
|---|---|
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Planned namespace | `AgentFactory` |
| Latest Data Fabric discovery | `uip df entities list --native-only --output json` returned `[]` |
| Latest choice-set discovery | `uip df choice-sets list --output json` returned `[]` |

## Design Rules

- Keep `requestId` as the correlation key across every entity.
- Use Data Fabric-safe field names. Lifecycle fields are named
  `requestStatus`, `approvalStatus`, `buildRunStatus`, `testRunStatus`, and
  `deploymentStatus`; do not create a bare field named `status`.
- Store arrays, nested objects, and agent output snapshots as
  `MULTILINE_TEXT` JSON strings.
- Use `CHOICE_SET_SINGLE` for controlled lifecycle fields. Choice-set value
  names use letters, numbers, and underscores only; display names preserve
  contract values such as `local-simulated`.
- Record inserts must use each choice value `NumberId`, not the value name.
- Preserve `platformMode` as `local-simulated`, `uipath-ready`, or
  `uipath-live` through the choice-set display/contract mapping. Use
  `uipath-live` only after a live UiPath asset exists or runs.

## Proposed Choice Sets

| Choice set | Contract values |
|---|---|
| `AgentFactoryPlatformMode` | `local-simulated`, `uipath-ready`, `uipath-live` |
| `AgentFactoryRequestStatus` | `draft`, `clarifying`, `awaiting_scope_approval`, `approved_for_build`, `manifest_created`, `build_queued`, `building`, `build_failed`, `tests_running`, `tests_failed`, `awaiting_release_approval`, `deploying`, `deployed`, `blocked`, `cancelled` |
| `AgentFactoryRequestPriority` | `low`, `normal`, `high`, `urgent` |
| `AgentFactoryRiskTier` | `low`, `medium`, `high` |
| `AgentFactoryApprovalType` | `scope`, `release` |
| `AgentFactoryApprovalStatus` | `pending`, `approved`, `changes_requested`, `rejected`, `cancelled`, `expired` |
| `AgentFactoryBuildRunStatus` | `build_queued`, `building`, `build_failed`, `tests_running`, `tests_failed`, `awaiting_release_approval`, `deploying`, `deployed`, `blocked`, `cancelled` |
| `AgentFactoryBuildRunMode` | `sandbox` |
| `AgentFactoryTestRunStatus` | `queued`, `running`, `passed`, `failed`, `blocked` |
| `AgentFactoryGateResult` | `not_run`, `passed`, `failed`, `waived` |
| `AgentFactoryQualityGateDecision` | `pending`, `passed`, `failed`, `waived` |
| `AgentFactoryDeploymentStatus` | `pending`, `deployed`, `rolled_back`, `failed` |
| `AgentFactoryActorType` | `user`, `factory-api`, `uipath-maestro`, `uipath-agent`, `action-center`, `codex-worker` |

## Proposed Entities

| Entity | Purpose | Key fields |
|---|---|---|
| `AutomationRequest` | Primary lifecycle record aligned to `AutomationRequestSchema` plus intake fields | `requestId`, `requesterName`, `requesterEmail`, `title`, `businessGoal`, `targetAudience`, `dueDate`, `sourceSystemsJson`, `constraintsJson`, `requestText`, `requestedArtifactType`, `templateId`, `requestStatus`, `priority`, `ownerName`, `ownerEmail`, `platformMode`, `folderName`, `folderKey`, `folderId`, `currentApprovalId`, `currentBuildRunId`, `createdAt`, `updatedAt` |
| `StructuredSpec` | Requirements Agent output aligned to `StructuredSpecSchema` | `specId`, `requestId`, `businessGoal`, `dataSourcesJson`, `metricsJson`, `filtersJson`, `outputType`, `ownerName`, `ownerEmail`, `constraintsJson`, `clarificationQuestionsJson`, `clarificationAnswersJson`, `platformMode`, `createdAt`, `updatedAt` |
| `GovernanceAssessment` | Governance Agent risk and policy output | `assessmentId`, `requestId`, `riskTier`, `piiDetected`, `piiPolicy`, `forbiddenActionsJson`, `requiredApprovalsJson`, `policyDecisionsJson`, `policyViolationsJson`, `platformMode`, `createdAt` |
| `ApprovalTask` | Action Center task mirror | `taskId`, `requestId`, `approvalType`, `approverRole`, `approverName`, `approverEmail`, `approvalStatus`, `actionCenterTaskId`, `comments`, `payloadJson`, `decisionJson`, `platformMode`, `createdAt`, `completedAt` |
| `BuildManifest` | Governed build instruction record | `manifestId`, `requestId`, `manifestHash`, `templateId`, `artifactType`, `allowedFilesJson`, `approvedDataSourcesJson`, `approvedMetricsJson`, `requiredFiltersJson`, `piiPolicy`, `forbiddenActionsJson`, `outputTargetsJson`, `maxRepairAttempts`, `sandboxOnly`, `branchName`, `outputApp`, `codexModel`, `manifestJson`, `platformMode`, `createdAt` |
| `BuildRun` | Build worker execution state | `buildRunId`, `requestId`, `manifestId`, `buildRunStatus`, `mode`, `workerId`, `codexSessionId`, `branchName`, `commitSha`, `prUrl`, `generatedFilesJson`, `logsUri`, `platformMode`, `startedAt`, `completedAt`, `updatedAt` |
| `TestRun` | Quality gate evidence for local tests and optional Test Manager/Test Cloud records | `testRunId`, `requestId`, `buildRunId`, `testRunStatus`, `testManagerProjectId`, `testSetId`, `automatedResultsUrl`, `smokeResult`, `securityReviewResult`, `accessibilityResult`, `qualityGateDecision`, `notes`, `platformMode`, `createdAt`, `completedAt` |
| `DeploymentRecord` | Sandbox release artifact evidence | `deploymentId`, `requestId`, `buildRunId`, `deploymentStatus`, `environment`, `deploymentUrl`, `releasedBy`, `releasedAt`, `rollbackNotes`, `platformMode`, `createdAt` |
| `AuditEvent` | Append-only lifecycle audit event | `auditEventId`, `requestId`, `actorType`, `actorName`, `action`, `summary`, `payloadJson`, `createdAt` |

## Creation Plan

After explicit approval for the exact schema in
`uipath/data-service/schema.json`:

1. Create the proposed choice sets with `uip df choice-sets create ...`.
2. Create every choice-set value with `uip df choice-set-values create ...`.
3. Capture returned choice set IDs and choice value `NumberId` values.
4. Materialize entity create bodies by replacing `${ChoiceSetName.id}`
   placeholders in the schema JSON with returned choice set IDs.
5. Create entities with `uip df entities create <EntityName> --file <body>`.
6. Re-run `uip df entities list --native-only --output json`.
7. Re-read each created entity with `uip df entities get <id> --output json`.
8. Record returned entity and field IDs under `liveAssetIds` without
   committing credentials or generated build output.

## Seed Record Guidance

`uipath/data-service/schema.json` includes proposal-only seed templates for:

- `AutomationRequest` with `requestId = req_customer360_demo_001`
- `AuditEvent` with `action = intake_created`

Do not insert seed records until entities exist and choice-set value NumberIds
are known. Seed `platformMode` as `uipath-ready` until a live Maestro process,
Data Service record, Action Center task, API Workflow, or Test Manager asset
actually exists in Automation Cloud.

## Checkpoint 7 Evidence Boundary

Data Service mirroring is stretch evidence for the Maestro live path, not a
blocker for the first Maestro/API Workflow activation. If schema or record
creation is approved, capture the returned ids for the Factory API timeline:

| Entity | Evidence id to preserve |
|---|---|
| `AutomationRequest` | request record id |
| `ApprovalTask` | approval record id plus `actionCenterTaskId` |
| `BuildRun` | build run record id plus API Workflow execution id |
| `TestRun` | test run record id plus Test Manager/Test Cloud execution id |
| `DeploymentRecord` | deployment record id plus sandbox deployment URL |
| `AuditEvent` | audit event record id |

Until those record ids are returned by `uip df` commands, keep Data Service
state labeled `proposal-only` or `uipath-ready`, never `uipath-live`.
