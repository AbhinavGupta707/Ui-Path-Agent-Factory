You are the Checkpoint 4 Test Cloud And Quality Gates implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `docs/orchestration/checkpoint-4/README.md`
- `docs/orchestration/checkpoint-4/status.md`
- `docs/uipath-setup.md`
- `docs/test-cloud-quality-gates.md`
- `uipath/test-cloud/test-plan.md`
- `docs/customer360-template.md`
- `docs/build-worker.md`
- `.agents/skills/uipath-skill-catalog/SKILL.md`
- `.agents/skills/uipath-platform/SKILL.md`
- `.agents/skills/uipath-test/SKILL.md`

Base state: latest `main` at worker launch; the orchestrator records the exact base in `docs/orchestration/checkpoint-4/status.md`.

## Goal

Create a credible UiPath Test Manager/Test Cloud quality gate for generated Customer360 builds. If live project/test-set creation is available, create or prepare it safely; if not, keep the fallback honest and integrate local/CI test evidence as `Test Cloud-ready`.

## Ownership

You may edit:

- `uipath/test-cloud/**`
- `docs/test-cloud-quality-gates.md`
- targeted quality-gate docs or scripts if necessary
- `docs/orchestration/checkpoint-4/status.md` only for your lane status if needed

Coordinate before editing:

- `services/build-worker/**`
- `apps/customer360-template/**`
- root package scripts
- `packages/customer360-metrics/**`

Do not edit:

- `uipath/data-service/**`
- `uipath/maestro/**`
- `uipath/agents/**`
- `uipath/api-workflows/**`
- `uipath/action-center/**`
- `uipath/apps/**`
- `.env*` except `.env.example`
- generated build output

## Requirements

- Follow discovery-first diagnosis. Verify Test Manager command surface and project availability before treating missing assets as runtime failures.
- Re-run relevant read-only probes:
  - `uip login status --output json`
  - `uip tm testcases --help --output json`
  - `uip tm project list --limit 5 --output json`
  - `uip or folders get AgentFactoryDemo --output json`
- If live creation is possible and safe, prepare a Test Manager project named `Agent Factory Quality Gates`, with requirements/test cases/test set covering:
  - metric correctness
  - PII masking
  - generated dashboard build
  - worker manifest validation
  - release approval evidence
- Do not delete or overwrite any existing Test Manager project. If a matching project exists, discover and reuse it.
- Set the default folder before any Test Manager run command if you get to live execution.
- Do not run live test executions unless the target assets and side effects are clear and approved.
- Keep local tests as hard evidence even if Test Cloud is unavailable:
  - Customer360 metrics tests
  - Customer360 template build/tests
  - Build worker tests/smoke
  - `npm run smoke`
- Make all fallback wording precise: use `Test Cloud-ready` only when live Test Cloud/Test Manager creation or execution is not complete.

## Verification

Run the closest safe checks:

- read-only `uip` probes listed above
- `npm --workspace @agent-factory/customer360-metrics test`
- `npm --workspace @agent-factory/customer360-template run build`
- `npm --workspace @agent-factory/customer360-template test`
- `npm --workspace @agent-factory/build-worker test`
- JSON/markdown validation for test plan artifacts where applicable
- `git diff --check`

If a live Test Manager command is blocked or ambiguous, stop and report the exact upstream message and the next approved options.

## Handoff

Report:

- files changed
- live Test Manager/Test Cloud assets created or exact setup commands
- local/CI test evidence mapped to quality gates
- commands run and outcomes
- blockers, approvals needed, and fallback status
- integration notes for Data Service, Maestro, API Workflow, Action Center, and Factory Console
