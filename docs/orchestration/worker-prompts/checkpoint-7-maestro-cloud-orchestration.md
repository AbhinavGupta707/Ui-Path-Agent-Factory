# Checkpoint 7 Worker Prompt: Maestro Cloud Orchestration

You are the Checkpoint 7 Maestro Cloud Orchestration implementation lane for Agent Factory.

Read first:

- `AGENTS.md`
- `docs/hackathon-requirements-analysis.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/uipath-setup.md`
- `docs/maestro-bpmn.md`
- `docs/api-workflow-contract.md`
- `docs/action-center-approvals.md`
- `docs/data-service-schema.md`
- `docs/deployment.md`
- `uipath/README.md`

Also load the relevant UiPath skill docs before touching UiPath assets:

- `uipath-skill-catalog`
- `uipath-platform`
- `uipath-maestro-bpmn` if editing Maestro BPMN assets
- `uipath-api-workflow` if editing API workflow JSON
- `uipath-human-in-the-loop` or `uipath-tasks` if editing Action Center paths
- `uipath-data-fabric` if editing Data Service paths
- `uipath-test` if editing Test Manager/Test Cloud paths

Base state: start from the Checkpoint 7 planning commit on `main`.

## Goal

Prepare and, only after explicit approval, execute the Track 2 live UiPath Automation Cloud path where Maestro BPMN is the request-to-release orchestration spine.

## Ownership

You may edit:

- `uipath/maestro/*`
- `uipath/api-workflows/*`
- `uipath/action-center/*`
- `uipath/data-service/*`
- `uipath/test-manager/*`
- `docs/uipath-setup.md`
- `docs/maestro-bpmn.md`
- `docs/api-workflow-contract.md`
- `docs/action-center-approvals.md`
- `docs/data-service-schema.md`
- `docs/deployment.md`
- `docs/component-map.md`
- scripts only if needed for hosted/tunnel setup

Coordinate or avoid:

- Factory API implementation belongs to Agent Graph lane unless a tiny callback field or route contract is required.
- UI display belongs to Product UI lane.
- Build Worker behavior belongs to Codex lane.
- Do not run live mutations without explicit approval from the orchestrator/user.
- Do not edit `.env`, `.env.local`, generated `dist`, `.uipath/.skills`, or `.agents/skills`.

## Implementation Requirements

- Diagnose in layer order: registration/discovery/install first, runtime second.
- Prefer `uip` CLI over hand-written REST.
- Document the hosted or tunnel endpoint strategy for Automation Cloud callbacks.
- Make Maestro BPMN the primary Track 2 target, not a side proof.
- The BPMN path should cover intake, clarification, governance, scope approval, manifest/build planning, API Workflow call, quality evidence, release approval, sandbox deployment evidence, and audit closeout.
- Add or verify an API Workflow callback to Factory API or Build Worker.
- Add or verify a human gate through Action Center where platform activation allows it.
- Add Data Service mirroring as stretch evidence, not a blocker if Maestro/API Workflow is live.
- Record exact live ids needed by the Factory API timeline: Maestro process/run id, workflow execution id, Action Center task id, Data Service record id, Test Manager/Test Cloud ids where available.
- Keep all live states honest: `uipath-live` only after actual platform execution.
- Keep production deploy disabled.

## Verification

Safe local/read-only checks:

```bash
uip login status --output json
uip tm project list --limit 5 --output json
uip maestro bpmn validate <asset> --output json
git diff --check
```

Run publish/run/task/data-write commands only after explicit approval for the exact command.

## Handoff

Report:

- files changed,
- Maestro/API Workflow/Action Center/Data Service/Test evidence selected,
- exact approval still required or exact live command run,
- UiPath ids/evidence captured,
- docs updated,
- risks and next activation steps.
