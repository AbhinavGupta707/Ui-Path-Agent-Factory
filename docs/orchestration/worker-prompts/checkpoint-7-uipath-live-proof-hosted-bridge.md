# Checkpoint 7 Worker Prompt: UiPath Live Proof And Hosted Bridge

You are the Checkpoint 7 UiPath Live Proof And Hosted Bridge implementation lane for Agent Factory.

Read first:

- `AGENTS.md`
- `docs/checkpoint-7-live-product-plan.md`
- `docs/orchestration/checkpoint-7/README.md`
- `docs/uipath-setup.md`
- `docs/api-workflow-contract.md`
- `docs/action-center-approvals.md`
- `docs/deployment.md`
- `uipath/README.md`

Also load the relevant UiPath skill docs before touching UiPath assets:

- `uipath-skill-catalog`
- `uipath-platform`
- `uipath-api-workflow` if editing API workflow JSON
- `uipath-human-in-the-loop` or `uipath-tasks` if editing Action Center paths

Base state: start from the Checkpoint 7 planning commit on `main`.

## Goal

Prepare and, only after explicit approval, execute one narrow live UiPath proof that calls back into the Agent Factory lifecycle.

## Ownership

You may edit:

- `uipath/api-workflows/*`
- `uipath/action-center/*`
- `docs/uipath-setup.md`
- `docs/api-workflow-contract.md`
- `docs/deployment.md`
- `docs/component-map.md`
- scripts only if needed for hosted/tunnel setup

Coordinate or avoid:

- Factory API implementation belongs to Agent Graph lane unless a tiny callback field is required.
- UI display belongs to Product UI lane.
- Do not run live mutations without explicit approval from the orchestrator/user.
- Do not edit `.env`, `.env.local`, generated `dist`, `.uipath/.skills`, or `.agents/skills`.

## Implementation Requirements

- Diagnose in layer order: registration/discovery/install first, runtime second.
- Prefer `uip` CLI over hand-written REST.
- Document the hosted or tunnel endpoint strategy.
- Decide the first live proof target:
  - preferred: API Workflow execution against hosted/tunneled Factory API,
  - alternative: Action Center scope approval task,
  - stretch: Data Service audit record.
- Record the exact UiPath id needed by the Factory API timeline.
- Keep all live proof states honest: `uipath-live` only after actual platform execution.
- Keep production deploy disabled.

## Verification

Safe local/read-only checks:

```bash
uip login status --output json
uip tm project list --limit 5 --output json
git diff --check
```

Run live commands only after explicit approval for the exact command.

## Handoff

Report:

- files changed,
- live proof selected,
- exact approval still required or exact live command run,
- UiPath ids/evidence captured,
- docs updated,
- risks and next activation steps.

