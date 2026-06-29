# Checkpoint 4 Status

## Worker Sessions

Worker IDs are filled in by the orchestrator after thread creation.

| Lane | Thread | Pending ID | Worktree | Status | Notes |
|---|---|---|---|---|---|
| Maestro And Data Service | pending | pending | pending | preparing | Owns Data Service schema and Maestro BPMN/process assets |
| Agents And API Workflow | pending | pending | pending | preparing | Owns Agent Builder contracts and API Workflow assets |
| Apps And Action Center | pending | pending | `/Users/abhinavgupta/.codex/worktrees/a8e9/Agent Factory` | completed | Created proposal-only `uipath-ready` Action Center and UiPath Apps contracts; no live assets mutated |
| Test Cloud And Quality Gates | pending | pending | pending | preparing | Owns Test Manager/Test Cloud quality-gate assets |

## Integration Log

- Created Checkpoint 4 orchestration docs and worker prompts from `main` after Checkpoint 3 completion.
- Pre-launch local baseline `npm run smoke` passed.
- Pre-launch UiPath readiness probes succeeded for auth, folder, installed tool surface, Data Service, Maestro, Agents, Action Center, API Workflow, Coded Apps, and Test Manager discovery.
- Integration Service has no configured connections. API Workflow work must avoid fake connection IDs and must not use vendor connector placeholders without explicit approval.
- Data Service has no native entities yet. Entity creation must follow the schema proposal approval rule before live mutation.
- Test Manager has no projects yet. Test Cloud lane should create/import if permitted, otherwise keep the fallback clearly labeled `Test Cloud-ready`.
- Apps And Action Center lane re-ran read-only UiPath probes for login, folder, tasks, and coded app discovery. Action Center task list returned no tasks; `codedapp` is installed but has no `list` subcommand in this CLI surface.
- Apps And Action Center lane found that worker-prompt skill paths under `.agents/skills/...` are absent from this worktree, so it used the checked-in UiPath docs and CLI help as the source of truth.
- Apps And Action Center lane produced import-ready, proposal-only contracts under `uipath/action-center` and `uipath/apps`. No Action Center tasks, Coded Apps, Studio Web pushes, publishes, or deployments were created.

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
- Apps And Action Center lane: `uip login status --output json` passed for `galacticus / DefaultTenant`.
- Apps And Action Center lane: `uip or folders get AgentFactoryDemo --output json` passed with folder id `7986306` and key `cba41e19-47cc-4a0a-bf73-de88b60a61be`.
- Apps And Action Center lane: `uip tasks list --folder-id 7986306 --limit 5 --output json` passed with no tasks.
- Apps And Action Center lane: `uip codedapp --help --output json` passed and exposed `init`, `push`, `pull`, `pack`, `publish`, and `deploy`.
- Apps And Action Center lane: `uip codedapp list --help --output json` returned an expected validation error because `list` is not an installed subcommand.
- Apps And Action Center lane: `node uipath/action-center/validate-approval-contracts.mjs` passed.
- Apps And Action Center lane: `node uipath/apps/validate-companion-app.mjs` passed.
- Apps And Action Center lane: `git diff --check` passed.
- Apps And Action Center lane: `npm run smoke` initially found missing local npm dependencies (`tsc`/`vite` not installed); after `npm install`, `npm run smoke` passed across all workspace builds and tests.

## Manual Smoke Target

- Create or import Data Service entities and seed one demo request record.
- Create or import Maestro BPMN/process definition and show the lifecycle state mapping.
- Create or import Action Center approval contract/task.
- Validate API Workflow files and demonstrate no-auth/local worker call path; use live auth only with explicit approval.
- Create Test Manager/Test Cloud evidence if available, otherwise document exact fallback.
- Confirm Factory Console can display UiPath platform mode honestly.
