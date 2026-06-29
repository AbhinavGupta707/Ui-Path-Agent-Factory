You are the Checkpoint 4 Apps And Action Center implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `docs/orchestration/checkpoint-4/README.md`
- `docs/orchestration/checkpoint-4/status.md`
- `docs/uipath-setup.md`
- `docs/action-center-approvals.md`
- `uipath/action-center/approval-contracts.md`
- `uipath/apps/companion-app.md`
- `.agents/skills/uipath-skill-catalog/SKILL.md`
- `.agents/skills/uipath-platform/SKILL.md`
- `.agents/skills/uipath-tasks/SKILL.md`
- `.agents/skills/uipath-human-in-the-loop/SKILL.md`
- `.agents/skills/uipath-coded-apps/SKILL.md`

Base state: latest `main` at worker launch; the orchestrator records the exact base in `docs/orchestration/checkpoint-4/status.md`.

## Goal

Create the UiPath-facing intake/status companion and human approval layer. The result should make scope approval and release approval visible through Action Center, and should document or scaffold a UiPath Apps/Coded App companion without replacing the custom Factory Console.

## Ownership

You may edit:

- `uipath/action-center/**`
- `uipath/apps/**`
- `docs/action-center-approvals.md`
- targeted UiPath Apps/Action Center docs if you create them
- `docs/orchestration/checkpoint-4/status.md` only for your lane status if needed

Coordinate before editing:

- Factory Console UI code
- `services/factory-api/**`
- `packages/shared-contracts/**`
- root package scripts

Do not edit:

- `uipath/data-service/**`
- `uipath/maestro/**`
- `uipath/agents/**`
- `uipath/api-workflows/**`
- `uipath/test-cloud/**`
- `.env*` except `.env.example`
- `.uipath/.skills`
- `.agents/skills`
- generated build output

## Requirements

- Follow discovery-first diagnosis. Verify Action Center and coded app surfaces before assuming permissions/runtime issues.
- Re-run relevant read-only probes:
  - `uip login status --output json`
  - `uip tasks list --folder-id 7986306 --limit 5 --output json`
  - `uip codedapp --help --output json`
  - `uip or folders get AgentFactoryDemo --output json`
- Define exact Scope/Data Approval and Release Approval contracts:
  - reviewer-visible fields
  - outcomes
  - required decision payload
  - Data Service mirror fields
  - Maestro state transitions
- If you create a live task or complete a task, stop for explicit user approval first. Listing tasks is allowed.
- If you scaffold a Coded Web App or Coded Action App, follow `uipath-coded-apps`: identify app type, build before pack/publish/deploy, set `base: './'`, use `--folder-key` for deploy, and do not commit generated `.uipath` package output.
- If full coded app deployment is too large for this lane, produce an import-ready companion spec and exact CLI/portal steps with honest status labels.
- Do not over-build Slack/Teams or extra templates. Keep this lane focused on UiPath official UI and approvals.

## Verification

Run the closest safe checks:

- read-only `uip` probes listed above
- JSON/schema validation for approval contracts
- app build/typecheck if you scaffold a coded app
- `git diff --check`

If a live Action Center task or app deployment needs approval, report the exact command and expected effect instead of running it.

## Handoff

Report:

- files changed
- approval contracts created or updated
- whether any live tasks/apps were created, or exact setup steps if not
- commands run and outcomes
- approvals needed before live task creation/completion or app deployment
- integration notes for Maestro, Data Service, API Workflow, and Factory Console
