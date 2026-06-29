# Checkpoint 4 Status

## Worker Sessions

Worker IDs are filled in by the orchestrator after thread creation.

| Lane | Thread | Pending ID | Worktree | Status | Notes |
|---|---|---|---|---|---|
| Maestro And Data Service | delegated-current | pending | `/Users/abhinavgupta/.codex/worktrees/9afa/Agent Factory` | handoff-ready | Data Service exact proposal rendered; Maestro BPMN project import-ready and validated; no live schema/process mutation run |
| Agents And API Workflow | pending | pending | pending | preparing | Owns Agent Builder contracts and API Workflow assets |
| Apps And Action Center | pending | pending | pending | preparing | Owns UiPath Apps companion and Action Center approval contracts |
| Test Cloud And Quality Gates | pending | pending | pending | preparing | Owns Test Manager/Test Cloud quality-gate assets |

## Integration Log

- Created Checkpoint 4 orchestration docs and worker prompts from `main` after Checkpoint 3 completion.
- Pre-launch local baseline `npm run smoke` passed.
- Pre-launch UiPath readiness probes succeeded for auth, folder, installed tool surface, Data Service, Maestro, Agents, Action Center, API Workflow, Coded Apps, and Test Manager discovery.
- Integration Service has no configured connections. API Workflow work must avoid fake connection IDs and must not use vendor connector placeholders without explicit approval.
- Data Service has no native entities yet. Entity creation must follow the schema proposal approval rule before live mutation.
- Test Manager has no projects yet. Test Cloud lane should create/import if permitted, otherwise keep the fallback clearly labeled `Test Cloud-ready`.
- Maestro And Data Service lane reran discovery on 2026-06-29: login and folder facts still match, Data Fabric native entities and choice sets are empty, and Maestro process lists are empty.
- Data Service schema remains proposal-only in `uipath/data-service/schema.json`; explicit approval is required before creating choice sets, choice values, entities, fields, or seed records.
- Maestro BPMN source is import-ready in `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn` and validated locally, but no process was published or run.

## Launch Baseline

| Item | Value |
|---|---|
| Branch | `main` |
| Base commit | `b0c00fb` |
| Launch time UTC | `2026-06-29T00:30:34Z` |
| UiPath CLI | `1.195.1` |
| Organization | `galacticus` |
| Tenant | `DefaultTenant` |
| Folder | `AgentFactoryDemo` |
| Folder key | `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Folder id | `7986306` |

## Readiness Checks

| Check | Result |
|---|---|
| `uip login status --output json` | Passed; logged in to `galacticus / DefaultTenant`. |
| `uip tools list --output json` | Passed; core platform tools installed. |
| `uip or folders get AgentFactoryDemo --output json` | Passed; folder id/key matched docs. |
| `uip df entities list --native-only --output json` | Passed; no entities yet. |
| `uip maestro bpmn processes list --output json` | Passed; no processes yet. |
| `uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json` | Passed; no folder processes yet. |
| `uip agent list --output json` | Passed; no solutions yet. |
| `uip is connectors list --filter github --output json` | Passed; GitHub connector discoverable but inactive. |
| `uip is connections list --output json` | Passed; no Integration Service connections found. |
| `uip tasks list --folder-id 7986306 --limit 1 --output json` | Passed; no tasks yet. |
| `uip tm testcases --help --output json` | Passed; post-rename Test Manager CLI surface available. |
| `uip tm project list --limit 1 --output json` | Passed; no projects yet. |
| `uip solution init --help --output json` | Passed; post-rename solution CLI surface available. |
| `uip api-workflow validate --help --output json` | Passed; API Workflow static validation available. |
| `uip codedapp --help --output json` | Passed; coded app CLI surface available. |
| `npm run smoke` | Passed. |
| `uip df choice-sets list --output json` | Passed; no choice sets yet. |
| `uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json` | Passed; BPMN valid with one process, one start event, and three UiPath extensions. |
| `python3 -m json.tool uipath/data-service/schema.json` | Passed after Checkpoint 4 Maestro/Data Service lane updates. |
| `python3 -m json.tool uipath/maestro/process-contract.json` | Passed after Checkpoint 4 Maestro/Data Service lane updates. |
| `uip maestro bpmn pack uipath/maestro/customer360-build /private/tmp/agent-factory-maestro-pack --name agent-factory-customer360-build --version 0.1.0 --output json` | Passed; generated package only in `/private/tmp`, not committed. |
| `npm run smoke` (post Maestro/Data Service lane) | Passed after installing workspace dependencies; all workspace builds and 67 tests passed. |

## Checks Run

- Pre-launch `npm run smoke` passed across workspace builds and tests.
- Maestro And Data Service lane reran:
  - `uip --version`
  - `uip login status --output json`
  - `uip or folders get AgentFactoryDemo --output json`
  - `uip df entities list --native-only --output json`
  - `uip df choice-sets list --output json`
  - `uip maestro bpmn processes list --output json`
  - `uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json`
  - Data Fabric and Maestro CLI help discovery for create/validate flows
  - `python3 -m json.tool uipath/data-service/schema.json`
  - `python3 -m json.tool uipath/maestro/customer360-build/entry-points.json`
  - `python3 -m json.tool uipath/maestro/customer360-build/package-descriptor.json`
  - `uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json`
  - `uip maestro bpmn pack uipath/maestro/customer360-build /private/tmp/agent-factory-maestro-pack --name agent-factory-customer360-build --version 0.1.0 --output json`
  - `git diff --check`
  - `npm install`
  - `npm run smoke`

## Manual Smoke Target

- Create or import Data Service entities and seed one demo request record.
- Create or import Maestro BPMN/process definition and show the lifecycle state mapping.
- Create or import Action Center approval contract/task.
- Validate API Workflow files and demonstrate no-auth/local worker call path; use live auth only with explicit approval.
- Create Test Manager/Test Cloud evidence if available, otherwise document exact fallback.
- Confirm Factory Console can display UiPath platform mode honestly.
