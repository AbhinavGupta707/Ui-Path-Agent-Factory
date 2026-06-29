# Checkpoint 7 Status

Started: 2026-06-29. Final QA completed from `d463f1f` (`Record checkpoint 7 implementation merges`) after all four implementation lanes were merged into `main`.

Implementation base: `4d761b6` (`Align checkpoint 7 with AgentHack Track 2`).

## Lane State

| Lane | Worker | Thread | Worktree | State | Notes |
|---|---|---|---|---|---|
| Agent Graph And Clarification | local:6f481250-eb46-4db6-9de6-d4d95d2a4c15 | 019f1453-4f3a-76a0-a68e-3a31af8561df | `/Users/abhinavgupta/.codex/worktrees/98aa/Agent Factory` | merged | Lane commit `e00599f`; merged by `b649400`. Provider-backed questions after submit with deterministic/degraded fallback metadata. |
| Product UI Live Flow | local:e5efcafb-3017-4af7-a2d0-90108cbeed79 | 019f1453-9a9f-7643-b050-964c3ddfaa41 | `/Users/abhinavgupta/.codex/worktrees/22c7/Agent Factory` | merged | Lane commit `75bfca5`; merged by `c0cdf52`. Reference-style UI wired to real lifecycle endpoints. |
| Codex Worker Live Execution | local:9f8fac2d-85f9-4be4-b122-460231e785e5 | 019f1453-d10b-7522-a9e9-db97960792fc | `/Users/abhinavgupta/.codex/worktrees/5821/Agent Factory` | merged | Lane commit `7088401`; merged by `6f113d1`. Safe opt-in live Codex runner evidence and default blocked state. |
| Maestro Cloud Orchestration | local:a69eff27-32a0-48d9-be8b-660b04533735 | 019f1454-0ac3-7712-9d06-04b2a0ce1042 | `/Users/abhinavgupta/.codex/worktrees/a8bf/Agent Factory` | merged | Lane commit `425e61d`; merged by `e6d25f5`. Track 2 Maestro BPMN path is validated/import-ready; live mutations remain approval-gated. |
| QA, Evidence, And Submission Runbook | local final QA lane | 019f0ff5-72fb-7390-b4d0-613600a3c2cf delegated lane | `/Users/abhinavgupta/.codex/worktrees/9694/Agent Factory` | complete | Refreshed runbook/truth tables/status docs and ran full local verification plus safe read-only UiPath checks. |

## Final Truth Table

| Status | Evidence |
|---|---|
| Live | UiPath login context for `galacticus / DefaultTenant`; Orchestrator folder `AgentFactoryDemo` id `7986306`; Test Manager project `AFQG` / `Agent Factory Quality Gates`; seven Test Manager test cases; live Codex CLI readiness/build through the Build Worker isolated workspace. |
| Local runnable | Factory Console, Factory API lifecycle and live-evidence callback endpoint, Build Worker contract, API Workflow local runner handoff, Customer360 dashboard, sandbox `/deploy`, local tests, and demo smoke. |
| Import-ready/validated | Maestro BPMN at `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn`; six API Workflow JSON assets including `AgentFactory_RecordUiPathEvent`; five low-code Agent projects. |
| Proposal-only | Data Service schema, Action Center approval contracts, and UiPath Apps companion contract. |
| Blocked or still approval-sensitive | Maestro publish/run is blocked by UiPath `Invalid argument 'Period'`; Action Center task creation depends on a live Maestro/human task route; Data Service writes remain deferred to avoid shared-tenant collisions; Test Cloud execution and production release were not run. |

## Final QA Verification

| Check | Result |
|---|---|
| `npm install` | Passed; installed missing dependencies for this worktree; audit reported 0 vulnerabilities. |
| `npm run lint` | Passed; privacy/security scan checked 71 files with 0 errors and 0 warnings. |
| `npm run typecheck` | Passed after dependency install. |
| `npm test` | Passed across Customer360 metrics, shared contracts, Build Worker, Factory API, and Customer360 template. |
| `npm run build` | Passed across all workspaces, including both Vite apps. |
| `npm run smoke` | Passed; build plus test suite completed. |
| `npm run smoke:demo` | Passed without secrets, live UiPath mutation, or external deployment. |
| `git diff --check` | Passed after final QA docs edits. |
| `uip login status --output json` | Passed; logged into `https://cloud.uipath.com`, org `galacticus`, tenant `DefaultTenant`. |
| `uip or folders get AgentFactoryDemo --output json` | Passed; folder id `7986306`, key `cba41e19-47cc-4a0a-bf73-de88b60a61be`. |
| `uip tm project list --limit 5 --output json` | Passed; project `AFQG` / `Agent Factory Quality Gates` exists and is active. |
| `uip tm testcases list --project-key AFQG --output json` | Passed; seven test cases exist. |
| `uip maestro bpmn validate ... --output json` | Passed; BPMN is valid with one process, one start event, and three UiPath extensions. |
| `npm run uipath:live-plan` | Passed; prints exact approval-gated publish/run/evidence commands without mutating UiPath. |
| `npm run uipath:readiness` | Passed; read-only UiPath login/folder/Test Manager checks plus BPMN and six API Workflow validations. |
| Live activation attempt | Partial; see `docs/orchestration/checkpoint-7/live-activation-evidence-2026-06-29.md`. API Workflow local runner -> Build Worker -> live Codex -> sandbox deployment succeeded. Maestro publish/debug did not produce a cloud process instance. |

## Live Spine Hardening After Final QA

- Added `POST /api/requests/:id/uipath-event` so live Maestro/API Workflow/Action Center/Data Service/Test Manager identifiers become first-class Factory API evidence.
- Added `GET /api/uipath/readiness` for product/script readiness checks.
- Added `AgentFactory_RecordUiPathEvent` API Workflow to post redacted live evidence into the Factory API timeline.
- Updated Factory Console evidence so Maestro/API Workflow/human gate/Data Service/Codex rows show `uipath-live` only when real IDs exist.
- Added `npm run uipath:live-plan` and `npm run uipath:readiness` for exact activation planning and safe validation.
- Ran an approved live activation attempt on 2026-06-29. The local API Workflow runner queued `BUILD-REQ-2026-001-001`; live Codex readiness passed with session `019f14f9-8e3b-7232-9d59-6ee2c428279f`; the worker generated 14 files and passed all five guardrail checks; Factory API recorded sandbox deployment `DEP-REQ-2026-001-001`.

## Final Demo Path

1. Run `npm run dev:live`.
2. Open the Factory Console at the printed URL, usually `http://localhost:5183`.
3. Submit the Customer360 analytics request from `docs/live-demo-runbook.md`.
4. Answer generated clarification questions.
5. Review plan, governance, PII masking, allowed files, forbidden actions, and approvals.
6. Approve local scope/data.
7. Start the build handoff. The latest activation evidence shows live Codex readiness/build passed through the Build Worker isolated workspace; rerun only with bounded manifest approval.
8. Show UiPath evidence: live Test Manager catalog, validated Maestro BPMN, import-ready API Workflows/Agents, and the live-evidence callback surface. Do not claim a live Maestro process instance or Action Center task until the publish/debug blocker is resolved and real platform ids exist.
9. Open the Customer360 sandbox preview.
10. Close with the evidence drawer and final truth table.

## Residual Risks

- Maestro cloud activation is blocked before process-instance creation: `uip maestro bpmn process publish` returns `HTTP 400: Invalid argument 'Period'`, and the official debug path did not produce a recent instance.
- API Workflow assets can validate and run through the local UiPath runner, but these JSON assets are not full packaged cloud API Workflow projects.
- Public ngrok payload egress was blocked by policy; use a trusted hosted bridge with access controls before sending request/manifest payloads from Automation Cloud.
- No Action Center task, Data Service write, or Test Cloud execution was performed in the activation pass.
- The local demo depends on local ports being free. Use the URLs printed by `npm run dev:live`.
- Provider-backed Fireworks/LangSmith behavior requires owner-managed local/deployment configuration and sanitized trace review.
- Demo screenshots/video remain unchecked until captured; crop setup prompts, terminal secrets, provider dashboards, and trace payloads.

## Exact Approvals Still Required

- Resolve the UiPath Maestro `Invalid argument 'Period'` publish/debug blocker with UiPath CLI/platform support or a Studio Web-authored ProcessOrchestration package.
- Approve a trusted HTTPS callback bridge before sending request/manifest payloads from Automation Cloud.
- Approve any Action Center task creation/completion command after Maestro reaches a real user task.
- Approve any AgentFactory Data Service schema/entity/record write command after materializing unique names and choice-set IDs.
- Approve any live Test Manager/Test Cloud execution command.
- Approve any public hosting with secrets or production release command.
