You are the Checkpoint 4 Agents And API Workflow implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `docs/orchestration/checkpoint-4/README.md`
- `docs/orchestration/checkpoint-4/status.md`
- `docs/uipath-setup.md`
- `docs/api-workflow-contract.md`
- `uipath/agents/agent-contracts.md`
- `uipath/api-workflows/contracts.md`
- `docs/build-worker.md`
- `.agents/skills/uipath-skill-catalog/SKILL.md`
- `.agents/skills/uipath-platform/SKILL.md`
- `.agents/skills/uipath-agents/SKILL.md`
- `.agents/skills/uipath-api-workflow/SKILL.md`

Base state: latest `main` at worker launch; the orchestrator records the exact base in `docs/orchestration/checkpoint-4/status.md`.

## Goal

Produce the live-ready UiPath Agent and API Workflow layer that turns structured requests into governed manifests and lets Maestro/API Workflow trigger or poll the local Build Worker without pretending unavailable connector state exists.

## Ownership

You may edit:

- `uipath/agents/**`
- `uipath/api-workflows/**`
- `docs/api-workflow-contract.md`
- targeted agent/API workflow docs if you create them
- `docs/orchestration/checkpoint-4/status.md` only for your lane status if needed

Coordinate before editing:

- `services/build-worker/**`
- `services/factory-api/**`
- `packages/shared-contracts/**`
- root scripts/package config

Do not edit:

- `uipath/data-service/**`
- `uipath/maestro/**`
- `uipath/action-center/**`
- `uipath/apps/**`
- `uipath/test-cloud/**`
- `.env*` except `.env.example`
- `.uipath/.skills`
- `.agents/skills`
- generated build output

## Requirements

- Follow discovery-first diagnosis. Verify auth/tool/agent/API workflow surface before implementation.
- Re-run relevant read-only probes:
  - `uip login status --output json`
  - `uip agent list --output json`
  - `uip api-workflow validate --help --output json`
  - `uip is connections list --output json`
- Refine or create concrete agent assets/prompts for Requirements, Clarification, Governance, Build Planner, and Test Summary. Keep outputs structured and bounded to the Customer360 scenario.
- If creating low-code `agent.json` or solution files, follow the `uipath-agents` skill lifecycle. Probe `uip solution init --help --output json` before solution scaffold/deploy.
- Implement or document API Workflow JSON files for:
  - `AgentFactory_StartBuildWorker`
  - `AgentFactory_FetchBuildStatus`
  - `AgentFactory_PostStatusUpdate`
  - `AgentFactory_RecordTestResult`
  - `AgentFactory_StartDeployment`
- Prefer no-auth/local HTTP workflows for the local Build Worker where possible. Use `uip api-workflow validate <file> --output json` as the autonomous validation closure.
- Do not run `uip api-workflow run` without explicit user approval. With-auth runs are especially restricted because real connector/HTTP side effects can occur.
- Do not invent Integration Service connection IDs. Current readiness found no connections, so any vendor-connector workflow must stop for setup/approval or remain explicitly import-ready.
- Align request/build/test status fields with Data Service and Maestro contracts, but do not edit those lane-owned files unless necessary and coordinated.

## Verification

Run the closest safe checks:

- `uip api-workflow validate <workflow-file> --output json` for every workflow JSON you create
- `python3 -m json.tool <json-file>` for JSON assets
- read-only `uip` probes listed above
- package or agent validation commands if you create a solution/agent project and they are available
- `git diff --check`

If a runtime run is needed, stop and describe the command plus the side effect profile instead of running it.

## Handoff

Report:

- files changed
- agent assets created or updated
- API Workflow assets created, validation status, and run mode requirements
- whether any live UiPath agents/workflows were created
- commands run and outcomes
- risks, missing connections, or explicit approvals needed
- integration notes for Maestro, Data Service, Action Center, and Build Worker
