# Checkpoint 4 Status

## Worker Sessions

Worker IDs are filled in by the orchestrator after thread creation.

| Lane | Thread | Pending ID | Worktree | Status | Notes |
|---|---|---|---|---|---|
| Maestro And Data Service | pending | pending | pending | preparing | Owns Data Service schema and Maestro BPMN/process assets |
| Agents And API Workflow | pending | pending | pending | preparing | Owns Agent Builder contracts and API Workflow assets |
| Apps And Action Center | pending | pending | pending | preparing | Owns UiPath Apps companion and Action Center approval contracts |
| Test Cloud And Quality Gates | pending | pending | pending | completed | Created live Test Manager project `AFQG`, test set `AFQG:1`, and seven quality-gate test cases; no live executions run |

## Integration Log

- Created Checkpoint 4 orchestration docs and worker prompts from `main` after Checkpoint 3 completion.
- Pre-launch local baseline `npm run smoke` passed.
- Pre-launch UiPath readiness probes succeeded for auth, folder, installed tool surface, Data Service, Maestro, Agents, Action Center, API Workflow, Coded Apps, and Test Manager discovery.
- Integration Service has no configured connections. API Workflow work must avoid fake connection IDs and must not use vendor connector placeholders without explicit approval.
- Data Service has no native entities yet. Entity creation must follow the schema proposal approval rule before live mutation.
- At launch, Test Manager had no projects. Test Cloud lane should create/import if permitted, otherwise keep the fallback clearly labeled `Test Cloud-ready`.
- Test Cloud lane created Test Manager project `Agent Factory Quality Gates` (`AFQG`, id `2760d770-7e82-0000-66f7-0b49d3053e3f`), set the project default folder to `AgentFactoryDemo`, created test set `Customer360 Release Gate` (`AFQG:1`, id `66cdd3ea-c873-0200-58fb-0b49d305588a`), and added seven gate test cases. No live executions were run.

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

## Checks Run

- Pre-launch `npm run smoke` passed across workspace builds and tests.
- Test Cloud lane read-only discovery passed for `uip --version`, `uip login status --output json`, `uip tm testcases --help --output json`, `uip tm project list --limit 5 --output json`, and `uip or folders get AgentFactoryDemo --output json`.
- Test Cloud lane asset verification passed for `uip tm testcases list --project-key AFQG --output json`, `uip tm testsets list --project-key AFQG --output json`, and `uip tm testsets list-testcases --project-key AFQG --test-set-key AFQG:1 --output json`.
- Test Cloud lane local evidence passed for `npm --workspace @agent-factory/customer360-metrics test`, `npm --workspace @agent-factory/customer360-template run build`, `npm --workspace @agent-factory/customer360-template test`, `npm --workspace @agent-factory/build-worker test`, and `npm run smoke`.
- `node -e "JSON.parse(...quality-gate-assets.json...)"` and `git diff --check` passed.

## Manual Smoke Target

- Create or import Data Service entities and seed one demo request record.
- Create or import Maestro BPMN/process definition and show the lifecycle state mapping.
- Create or import Action Center approval contract/task.
- Validate API Workflow files and demonstrate no-auth/local worker call path; use live auth only with explicit approval.
- Create Test Manager/Test Cloud evidence if available, otherwise document exact fallback.
- Confirm Factory Console can display UiPath platform mode honestly.
