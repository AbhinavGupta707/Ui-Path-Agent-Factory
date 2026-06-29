# Submission Checklist

Current as of Checkpoint 5 docs lane on 2026-06-29.

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

## UiPath Assets

- [x] Orchestrator folder `AgentFactoryDemo` is verified live.
- [x] Test Manager project `Agent Factory Quality Gates` is live.
- [x] Test set `Customer360 Release Gate` is live.
- [x] Seven Test Manager test cases are live.
- [x] No live Test Manager/Test Cloud execution has been run without approval.
- [x] Data Service schema is proposal-only and source-controlled.
- [x] Maestro BPMN is validated/import-ready.
- [x] Low-code Agent projects are validated/import-ready.
- [x] API Workflow JSON assets are validated/import-ready.
- [x] Action Center approval contracts are proposal-only.
- [x] UiPath Apps companion contract is proposal-only.

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

- Deployment/Runtime added exact sandbox deployment commands and the local `/deploy` endpoint.
- `AgentFactory_StartDeployment` targets `POST /deploy`, which is implemented locally for sandbox evidence.
- Build Worker default runtime reports `blocked` until a live Codex/Git runner is injected.
- Final QA added the demo smoke scripts, browser checklist, and final risk register.
- If another lane changes ports, deployment behavior, or platform status, update README, `docs/setup.md`, `docs/demo-script.md`, `docs/devpost-submission.md`, and `docs/component-map.md`.
