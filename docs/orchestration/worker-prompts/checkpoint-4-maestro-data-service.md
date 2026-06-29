You are the Checkpoint 4 Maestro And Data Service implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `docs/orchestration/checkpoint-4/README.md`
- `docs/orchestration/checkpoint-4/status.md`
- `docs/uipath-setup.md`
- `docs/maestro-bpmn.md`
- `docs/data-service-schema.md`
- `uipath/service-readiness.md`
- `uipath/maestro/process-contract.json`
- `uipath/maestro/bpmn-export-or-notes.md`
- `uipath/data-service/schema.json`
- `.agents/skills/uipath-skill-catalog/SKILL.md`
- `.agents/skills/uipath-platform/SKILL.md`
- `.agents/skills/uipath-data-fabric/SKILL.md`
- `.agents/skills/uipath-maestro-bpmn/SKILL.md`

Base state: latest `main` at worker launch; the orchestrator records the exact base in `docs/orchestration/checkpoint-4/status.md`.

## Goal

Turn the planned Data Service and Maestro contracts into live-ready or live-created UiPath assets. The result should let the demo show UiPath as the lifecycle owner, with Data Service as the state/audit store and Maestro as the visual BPMN process spine.

## Ownership

You may edit:

- `uipath/data-service/**`
- `uipath/maestro/**`
- `docs/data-service-schema.md`
- `docs/maestro-bpmn.md`
- `docs/uipath-setup.md` only for targeted Checkpoint 4 facts
- `docs/orchestration/checkpoint-4/status.md` only for your lane status if needed

Coordinate before editing:

- shared contracts under `packages/shared-contracts/**`
- Factory API/Console code
- root package scripts

Do not edit:

- other checkpoint worker prompt files
- `.env*` except `.env.example`
- `.uipath/.skills`
- `.agents/skills`
- generated `dist/**` or `node_modules/**`

## Requirements

- Follow discovery-first diagnosis: verify registration/discovery/install state before debugging runtime behavior.
- Re-run relevant read-only probes:
  - `uip login status --output json`
  - `uip or folders get AgentFactoryDemo --output json`
  - `uip df entities list --native-only --output json`
  - `uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json`
- Translate `uipath/data-service/schema.json` into a Data Fabric-compatible creation plan. UiPath Data Fabric field names must be valid and should avoid reserved words. Do not blindly use `status` as a field name if the tool rejects it; propose a domain-safe rename such as `requestStatus`, `runStatus`, or `qualityGateStatus`.
- Before any live Data Service schema creation or schema update, render the exact proposed entity/field schema in your handoff and wait for explicit approval. Do not run `uip df entities create` or schema-altering `update` without that approval.
- If live creation is approved and succeeds, re-read entities and record entity IDs in `uipath/data-service/schema.json` or docs without committing credentials.
- Create or refine import-ready Maestro BPMN/process source aligned to the main path:
  intake -> requirements -> clarification -> governance -> scope approval -> build manifest -> API Workflow build trigger -> test gate -> release approval -> deploy -> audit.
- For Maestro BPMN files, use the Maestro skill rules: BPMN XML is the source of record, do not hand-author Integration Service connection details, validate before any operate step, and do not publish/run without explicit approval.
- Keep platform mode labels honest: `uipath-live` only after an asset exists or runs in Automation Cloud.

## Verification

Run the closest safe checks:

- `python3 -m json.tool uipath/data-service/schema.json`
- `python3 -m json.tool uipath/maestro/process-contract.json`
- read-only `uip` probes listed above
- XML/BPMN validation if you add a `.bpmn`
- any Maestro CLI local validation available for the generated project
- `git diff --check`

If a check cannot run, explain exactly why and what evidence replaces it.

## Handoff

Report:

- files changed
- whether Data Service assets were live-created, proposal-only, or import-ready
- exact entity names, field proposal, and any IDs discovered or created
- whether Maestro assets were live-created, proposal-only, or import-ready
- commands run and outcomes
- risks, blockers, and explicit approval needed before live mutation
- merge notes for downstream lanes
