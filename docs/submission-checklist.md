# Submission Checklist

Current as of Checkpoint 7 final QA on 2026-06-29.

## Repository And License

- [x] Public-ready repository structure is documented.
- [x] MIT license exists.
- [x] README explains the product, setup, run commands, UiPath usage, and current boundaries.
- [x] Setup runbook exists in `docs/setup.md`.
- [x] Component map exists in `docs/component-map.md`.
- [x] Devpost draft copy exists in `docs/devpost-submission.md`.
- [x] Five-minute demo script exists in `docs/demo-script.md`.

## Local Demo

- [x] Factory Console runs locally.
- [x] Factory API runs locally.
- [x] Build Worker service contract runs locally.
- [x] Customer360 dashboard runs locally.
- [x] Customer360 dashboard uses synthetic data and masks direct identifiers.
- [x] Local tests cover metrics, PII masking, API lifecycle, worker contracts, and dashboard build/smoke behavior.
- [x] Final QA smoke wrapper `npm run smoke:demo` exists and passes.
- [x] Full Checkpoint 7 verification suite passed locally after dependency install.

## UiPath Assets

- [x] Orchestrator folder `AgentFactoryDemo` is verified live.
- [x] Test Manager project `Agent Factory Quality Gates` is live.
- [x] Test set `Customer360 Release Gate` is live.
- [x] Seven Test Manager test cases are live.
- [x] No live Test Manager/Test Cloud execution has been run without approval.
- [x] Data Service schema is proposal-only and source-controlled.
- [x] Maestro BPMN is validated and solution-deployed live; current patched candidate is `1.0.1` in isolated folder `AgentFactoryDemoLiveSpine 1`.
- [x] Direct Maestro publish is still blocked by UiPath `Invalid argument 'Period'`; solution deployment is the working activation path.
- [x] Approved Maestro run attempt against the solution-deployed process still failed before process-instance/job/task creation; no live run is claimed.
- [x] Low-code Agent projects are validated/import-ready.
- [x] Six API Workflow JSON assets are validated/import-ready, include live UiPath evidence callback recording, and pass optional trusted bridge token headers; `AgentFactory_StartBuildWorker` succeeded through the local UiPath API Workflow runner.
- [x] Action Center approval contracts are proposal-only.
- [x] UiPath Apps companion contract is proposal-only.

## Final Truth Table

- [x] Live: UiPath login context for `galacticus / DefaultTenant`, Orchestrator folder `AgentFactoryDemo`, isolated solution folders `AgentFactoryDemoLiveSpine` and `AgentFactoryDemoLiveSpine 1`, current solution-deployed Maestro process/release `1.0.1`, Test Manager project `AFQG`, seven Test Manager test cases, and live Codex readiness/build evidence through the Build Worker.
- [x] Local: Factory Console, Factory API lifecycle, trusted bridge callback contract, Build Worker contract, Customer360 dashboard, tests, sandbox `/deploy`, API Workflow local-runner handoff, and demo smoke.
- [x] Import-ready: six UiPath API Workflow JSON assets, five low-code Agent projects, and source-level Maestro bindings that still need live discovery for a runtime run.
- [x] Proposal-only: Data Service schema, Action Center approval contracts, and UiPath Apps companion contract.
- [x] Blocked or approval-sensitive: Maestro runtime binding/run completion, cloud API Workflow packaging/upload/run, Action Center task creation/completion, Data Service writes, Agent upload/deploy/run, Test Cloud execution, future paid live Codex execution, public hosting with secrets, and production release.

## Approval Boundaries

- [x] README and setup docs state that Data Service creation requires approval.
- [x] README and setup docs state that Maestro publish/run requires approval.
- [x] README and setup docs state that Agent/API Workflow upload or runtime calls require approval.
- [x] README and setup docs state that Action Center task creation/completion requires approval.
- [x] README and setup docs state that UiPath Apps publish/deploy requires approval.
- [x] README and setup docs state that live Test Manager execution requires approval.
- [x] README and setup docs state that production deployment is out of scope.

## Demo Recording Assets

- [ ] Demo video under five minutes.
- [ ] Final screenshots or clips of Factory Console.
- [ ] Final screenshots or clips of Customer360 dashboard.
- [ ] Final screenshot of live Test Manager catalog.
- [ ] Final screenshot or visual of validated Maestro BPMN.
- [ ] Presentation deck link.
- [ ] Hosted preview URL if Deployment/Runtime lane provides one.

## Known Open Facts For Integration

- Final QA verified Checkpoint 7 from `d463f1f` after the four implementation lanes merged.
- Deployment/Runtime added exact sandbox deployment commands and the local `/deploy` endpoint.
- `AgentFactory_StartDeployment` targets `POST /deploy`, which is implemented locally for sandbox evidence.
- Build Worker default runtime reports `blocked` until a live Codex/Git runner is injected; the approved 2026-06-29 activation passed live Codex readiness/build and generated sandbox evidence.
- `AgentFactoryMaestroSolutionBridgeSpine` version `1.0.1` is live in `AgentFactoryDemoLiveSpine 1`; runtime run still needs executable API Workflow/Action/Agent bindings before a real process instance can be claimed.
- Final QA refreshed the demo runbook, browser/check evidence, and final risk register.
- If another lane changes ports, deployment behavior, or platform status, update README, `docs/setup.md`, `docs/demo-script.md`, `docs/devpost-submission.md`, and `docs/component-map.md`.
