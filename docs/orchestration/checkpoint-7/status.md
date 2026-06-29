# Checkpoint 7 Status

Started: 2026-06-29. Final QA completed from `d463f1f` (`Record checkpoint 7 implementation merges`) after all four implementation lanes were merged into `main`.

Implementation base: `4d761b6` (`Align checkpoint 7 with AgentHack Track 2`).

## Lane State

| Lane | Worker | Thread | Worktree | State | Notes |
|---|---|---|---|---|---|
| Agent Graph And Clarification | local:6f481250-eb46-4db6-9de6-d4d95d2a4c15 | 019f1453-4f3a-76a0-a68e-3a31af8561df | `/Users/abhinavgupta/.codex/worktrees/98aa/Agent Factory` | merged | Lane commit `e00599f`; merged by `b649400`. Provider-backed questions after submit with deterministic/degraded fallback metadata. |
| Product UI Live Flow | local:e5efcafb-3017-4af7-a2d0-90108cbeed79 | 019f1453-9a9f-7643-b050-964c3ddfaa41 | `/Users/abhinavgupta/.codex/worktrees/22c7/Agent Factory` | merged | Lane commit `75bfca5`; merged by `c0cdf52`. Reference-style UI wired to real lifecycle endpoints. |
| Codex Worker Live Execution | local:9f8fac2d-85f9-4be4-b122-460231e785e5 | 019f1453-d10b-7522-a9e9-db97960792fc | `/Users/abhinavgupta/.codex/worktrees/5821/Agent Factory` | merged | Lane commit `7088401`; merged by `6f113d1`. Safe opt-in live Codex runner evidence and default blocked state. |
| Maestro Cloud Orchestration | local:a69eff27-32a0-48d9-be8b-660b04533735 | 019f1454-0ac3-7712-9d06-04b2a0ce1042 | `/Users/abhinavgupta/.codex/worktrees/a8bf/Agent Factory` | merged | Lane commit `425e61d`; merged by `e6d25f5`. Track 2 Maestro BPMN path validates; final QA later solution-deployed patched version `1.0.1` in isolated folder `AgentFactoryDemoLiveSpine 1`. |
| QA, Evidence, And Submission Runbook | local final QA lane | 019f0ff5-72fb-7390-b4d0-613600a3c2cf delegated lane | `/Users/abhinavgupta/.codex/worktrees/9694/Agent Factory` | complete | Refreshed runbook/truth tables/status docs, added trusted bridge hardening, performed approved isolated UiPath solution activation checks, and reran the full verification suite. |

## Final Truth Table

| Status | Evidence |
|---|---|
| Live | UiPath login context for `galacticus / DefaultTenant`; original Orchestrator folder `AgentFactoryDemo` id `7986306`; historical solution folder `AgentFactoryDemoLiveSpine` id `7989131`; current patched solution folder `AgentFactoryDemoLiveSpine 1` id `7989142`; solution-deployed Maestro process `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1` with release `70d07489-d32a-4f56-9f5e-5fadaf8b14e6`; Test Manager project `AFQG` / `Agent Factory Quality Gates`; seven Test Manager test cases; live Codex CLI readiness/build through the Build Worker isolated workspace. |
| Local runnable | Factory Console, Factory API lifecycle and token-aware live-evidence callback endpoint, Build Worker contract with optional trusted bridge token, API Workflow local runner handoff, Customer360 dashboard, sandbox `/deploy`, local tests, and demo smoke. |
| Import-ready/validated | Maestro BPMN source and solution pack/deploy commands; six API Workflow JSON assets including `AgentFactory_RecordUiPathEvent`; five low-code Agent projects. |
| Proposal-only | Data Service schema, Action Center approval contracts, and UiPath Apps companion contract. |
| Blocked or still approval-sensitive | Direct `uip maestro bpmn process publish` is blocked by UiPath `Invalid argument 'Period'`; solution deployment works, but `uip maestro bpmn process run` still fails before an instance/job/task appears because executable Maestro service/user task bindings are not yet materialized through live discovery; Action Center task creation depends on that live human task route; Data Service writes remain deferred to avoid shared-tenant collisions; Test Cloud execution and production release were not run. |

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
| `uip or folders get "AgentFactoryDemoLiveSpine 1" --output json` | Passed; current patched solution folder id `7989142`, key `d991e64c-d0ad-4ec6-9798-8783b166a073`. |
| `uip tm project list --limit 5 --output json` | Passed; project `AFQG` / `Agent Factory Quality Gates` exists and is active. |
| `uip tm testcases list --project-key AFQG --output json` | Passed; seven test cases exist. |
| `uip maestro bpmn validate ... --output json` | Passed; BPMN is valid with one process, one start event, and three UiPath extensions. |
| `npm run uipath:live-plan` | Passed; prints exact approval-gated publish/run/evidence commands without mutating UiPath. |
| `npm run uipath:readiness` | Passed; read-only UiPath login/folder/Test Manager checks plus BPMN and six API Workflow validations. |
| `uip solution pack ... --version 1.0.1 --dry-run` | Passed; solution package status `Valid`. |
| `uip solution publish ... AgentFactoryMaestroSolutionBridgeSpine_1.0.1.zip --wait` | Passed; package version key `53399a60-1edb-4d51-a054-29b17533932c`, state `Ready`. |
| `uip solution deploy run ... --package-version 1.0.1 --folder-name "AgentFactoryDemoLiveSpine 1"` | Passed; deployment key `427de334-ba5e-4e95-bba1-d053abdad2f4`, activation `SuccessfulActivate`. |
| Live activation attempt | Partial; see `docs/orchestration/checkpoint-7/live-activation-evidence-2026-06-29.md` and `docs/orchestration/checkpoint-7/maestro-solution-activation-evidence-2026-06-29.md`. API Workflow local runner -> Build Worker -> live Codex -> sandbox deployment succeeded. Maestro solution publish/deploy succeeded for `1.0.0` and patched `1.0.1`; current `1.0.1` Maestro runtime run still did not produce an instance/job/task. |

## Live Spine Hardening After Final QA

- Added `POST /api/requests/:id/uipath-event` so live Maestro/API Workflow/Action Center/Data Service/Test Manager identifiers become first-class Factory API evidence.
- Added `GET /api/uipath/readiness` for product/script readiness checks.
- Added `AgentFactory_RecordUiPathEvent` API Workflow to post redacted live evidence into the Factory API timeline.
- Updated Factory Console evidence so Maestro/API Workflow/human gate/Data Service/Codex rows show `uipath-live` only when real IDs exist.
- Added `npm run uipath:live-plan` and `npm run uipath:readiness` for exact activation planning and safe validation.
- Ran an approved live activation attempt on 2026-06-29. The local API Workflow runner queued `BUILD-REQ-2026-001-001`; live Codex readiness passed with session `019f14f9-8e3b-7232-9d59-6ee2c428279f`; the worker generated 14 files and passed all five guardrail checks; Factory API recorded sandbox deployment `DEP-REQ-2026-001-001`.
- Hardened the trusted callback bridge: Factory API `uipath-live` callback mutations and Build Worker build/status routes support `AGENT_FACTORY_BRIDGE_TOKEN` via `x-agent-factory-bridge-token`; all six API Workflow assets now accept/pass `bridgeToken`; no token value is committed or printed.
- Published and deployed `AgentFactoryMaestroSolutionBridgeSpine` version `1.0.1` through UiPath Solutions into isolated folder `AgentFactoryDemoLiveSpine 1`. The process and release are visible, but the run command still fails before instance creation.

## Final Demo Path

1. Run `npm run dev:live`.
2. Open the Factory Console at the printed URL, usually `http://localhost:5183`.
3. Submit the Customer360 analytics request from `docs/live-demo-runbook.md`.
4. Answer generated clarification questions.
5. Review plan, governance, PII masking, allowed files, forbidden actions, and approvals.
6. Approve local scope/data.
7. Start the build handoff. The latest activation evidence shows live Codex readiness/build passed through the Build Worker isolated workspace; rerun only with bounded manifest approval.
8. Show UiPath evidence: live Test Manager catalog, live solution-deployed Maestro process/release, validated BPMN/API Workflow/Agent assets, and the live-evidence callback surface. Do not claim a live Maestro process instance or Action Center task until a run creates real ids.
9. Open the Customer360 sandbox preview.
10. Close with the evidence drawer and final truth table.

## Residual Risks

- Direct Maestro publish is blocked before release creation: `uip maestro bpmn process publish` returns `HTTP 400: Invalid argument 'Period'`. The supported UiPath Solutions path works and created live process/releases in isolated Agent Factory solution folders.
- Maestro runtime execution is still blocked before process-instance creation: current `1.0.1` run with feed `e4c3d330-c071-4dc1-9bb9-9a18c65dfd83` returns `MaestroProcessRunFailed`, and scoped instance/job/task lists are empty. The checked-in BPMN has the lifecycle model and entry point, but executable service/user task bindings still need live API Workflow/Action/Agent resource discovery.
- Two isolated Agent Factory solution folders now exist because UiPath created `AgentFactoryDemoLiveSpine 1` for the patched `1.0.1` deployment instead of updating the historical `AgentFactoryDemoLiveSpine` folder. This did not touch the separate `TreatmentAccessHackathon` project.
- API Workflow assets can validate and run through the local UiPath runner, but these JSON assets are not full packaged cloud API Workflow projects.
- Public ngrok payload egress was blocked by policy; use a trusted hosted bridge with access controls before sending request/manifest payloads from Automation Cloud.
- No Action Center task, Data Service write, or Test Cloud execution was performed in the activation pass.
- The local demo depends on local ports being free. Use the URLs printed by `npm run dev:live`.
- Provider-backed Fireworks/LangSmith behavior requires owner-managed local/deployment configuration and sanitized trace review.
- Demo screenshots/video remain unchecked until captured; crop setup prompts, terminal secrets, provider dashboards, and trace payloads.

## Exact Approvals Still Required

- Use UiPath Solutions rather than direct `uip maestro bpmn process publish` until UiPath resolves the `Invalid argument 'Period'` direct-publish issue.
- Configure an approved trusted HTTPS callback bridge and set `AGENT_FACTORY_BRIDGE_TOKEN` before sending request/manifest payloads from Automation Cloud.
- Bind or create live API Workflow/Action Center/Agent resources in Maestro/Studio Web, then rerun the solution-deployed process.
- Approve any Action Center task creation/completion command after Maestro reaches a real user task.
- Approve any AgentFactory Data Service schema/entity/record write command after materializing unique names and choice-set IDs.
- Approve any live Test Manager/Test Cloud execution command.
- Approve any public hosting with secrets or production release command.
