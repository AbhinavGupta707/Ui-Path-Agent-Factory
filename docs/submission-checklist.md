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
- [x] Maestro BPMN is validated/import-ready.
- [x] Low-code Agent projects are validated/import-ready.
- [x] Six API Workflow JSON assets are validated/import-ready, including live UiPath evidence callback recording.
- [x] Action Center approval contracts are proposal-only.
- [x] UiPath Apps companion contract is proposal-only.

## Final Truth Table

- [x] Live: UiPath login context for `galacticus / DefaultTenant`, Orchestrator folder `AgentFactoryDemo`, Test Manager project `AFQG`, and seven Test Manager test cases.
- [x] Local: Factory Console, Factory API lifecycle, Build Worker contract, Customer360 dashboard, tests, sandbox `/deploy`, and demo smoke.
- [x] Import-ready: Maestro BPMN, six UiPath API Workflow JSON assets, and five low-code Agent projects.
- [x] Proposal-only: Data Service schema, Action Center approval contracts, and UiPath Apps companion contract.
- [x] Approval-gated: Maestro publish/run, API Workflow upload/run, Action Center task creation/completion, Data Service writes, Agent upload/deploy/run, Test Cloud execution, live Codex execution, public hosting with secrets, and production release.

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
- Build Worker default runtime reports `blocked` until a live Codex/Git runner is injected.
- Final QA refreshed the demo runbook, browser/check evidence, and final risk register.
- If another lane changes ports, deployment behavior, or platform status, update README, `docs/setup.md`, `docs/demo-script.md`, `docs/devpost-submission.md`, and `docs/component-map.md`.
