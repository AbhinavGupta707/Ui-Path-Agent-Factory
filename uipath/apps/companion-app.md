# UiPath Apps Companion Surface

Status: `uipath-ready`, proposal-only. No UiPath Apps or Coded App assets were
created, pushed, published, or deployed by this lane.

Machine-readable assets:

- `companion-app.contract.json`
- `companion-app.schema.json`
- `validate-companion-app.mjs`

The custom Factory Console remains the polished primary demo UI. UiPath Apps is
the enterprise companion surface that proves the lifecycle is available inside
UiPath without replacing the console.

## Verified Context

| Field | Value |
|---|---|
| App name | `Agent Factory Intake Companion` |
| Coded app package | `AgentFactoryIntakeCompanion` |
| App type | Coded Web App |
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |
| Path name | `agent-factory-intake-companion` |
| Vite base | `./` |

## Discovery Evidence

Read-only probes passed:

```bash
uip codedapp --help --output json
uip codedapp init --help --output json
uip codedapp pack --help --output json
uip codedapp publish --help --output json
uip codedapp deploy --help --output json
uip codedapp list --help --output json
```

Results:

- `codedapp` is installed and exposes `init`, `push`, `pull`, `pack`,
  `publish`, and `deploy`.
- `uip codedapp list` is not available in this installed CLI surface, so live
  app inventory should be checked in Studio Web/Automation Cloud if needed.
- Deploy supports `--folder-key`, which must be set to
  `cba41e19-47cc-4a0a-bf73-de88b60a61be`.

## Screens

| Screen | Purpose | Data |
|---|---|---|
| Intake | Submit or mirror one Customer360 request | `AutomationRequest`, `AuditEvent` |
| Request Status | Show current lifecycle state and evidence | `AutomationRequest`, `ApprovalTask`, `BuildRun`, `TestRun`, `DeploymentRecord`, `AuditEvent` |
| Clarifications | Capture answers when Maestro routes back for missing scope | `StructuredSpec`, `AuditEvent` |
| Approval Links | Show scope/release task references and deep links | `ApprovalTask.actionCenterTaskId` |

The companion app should not complete Action Center tasks. Decisions remain in
Action Center so the audit trail is unambiguous.

## Intake Fields

| Field | Writes to |
|---|---|
| `title` | `AutomationRequest.title` |
| `requesterEmail` | `AutomationRequest.requesterEmail` |
| `businessGoal` | `AutomationRequest.businessGoal` |
| `targetAudience` | `AutomationRequest.targetAudience` |
| `dueDate` | `AutomationRequest.dueDate` |
| `sourceSystems` | `AutomationRequest.sourceSystemsJson` |
| `constraints` | `AutomationRequest.constraintsJson` |

Submit behavior:

- Create or mirror `AutomationRequest`.
- Set initial status to `clarifying`.
- Set `platformMode = "uipath-ready"` until live UiPath execution starts.
- Append `AuditEvent.action = "intake_created"`.
- Let Maestro continue orchestration.

## Setup Plan

Local scaffold and build steps:

```bash
uip codedapp init uipath/apps/agent-factory-intake-companion --template dashboard
```

Set the generated Vite config to:

```ts
export default defineConfig({
  base: "./"
});
```

Then build before packaging:

```bash
npm install
npm run build
```

Package to `/tmp` so generated package output is not committed:

```bash
uip codedapp pack ./dist --name "AgentFactoryIntakeCompanion" --version "0.1.0" --output /tmp/agent-factory-uipath-packages --description "Governed Agentic Automation Factory UiPath companion" --content-type webapp
```

Publish and deploy only after explicit approval:

```bash
uip codedapp publish --name "AgentFactoryIntakeCompanion" --version "0.1.0" --type Web --uipath-dir /tmp/agent-factory-uipath-packages --output json
uip codedapp deploy --name "AgentFactoryIntakeCompanion" --path-name agent-factory-intake-companion --version "0.1.0" --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --tags governance,agent-factory --output json
```

## Acceptance Criteria

- The app can submit or mirror one Customer360 intake.
- The app can show status for an existing `AutomationRequest`.
- The app can display current scope and release approval task references.
- The app does not store credentials, cookies, access tokens, or private keys.
- The Factory Console remains the primary UI in the demo narrative.
