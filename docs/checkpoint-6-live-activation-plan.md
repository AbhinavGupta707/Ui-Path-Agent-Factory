# Checkpoint 6 Live Activation Plan

Status: proposed execution plan. Do not run live UiPath mutations or paid model calls until approved.

## Goal

Turn Agent Factory from a local proof console into a live, agentic, product-quality workflow:

1. user submits a request,
2. agents clarify and govern it,
3. approvals gate scope/release,
4. a build worker generates or updates the Customer360 app,
5. tests run,
6. sandbox preview deploys,
7. audit and traces prove what happened.

## Lane 1: Product UI Redesign

Deliver:

- dark product shell matching the references
- New Request, Build Plan, Live Run, Output Preview views
- evidence drawer for backend details
- run timeline and progress components

Files:

- `apps/factory-console/src/App.tsx`
- `apps/factory-console/src/components/*`
- `apps/factory-console/src/factoryClient.ts`
- `apps/factory-console/src/*.css` or existing style blocks

Checks:

- `npm --workspace @agent-factory/factory-console run build`
- browser review at laptop widths

## Lane 2: Full Lifecycle API Client

Deliver:

- Factory Console can call every lifecycle endpoint
- request detail and timeline polling
- no silent local fallback when live mode is selected
- explicit config/degraded states

Endpoints to wire:

- `POST /api/intake`
- `POST /api/requests/:id/clarify`
- `POST /api/requests/:id/answers`
- `POST /api/requests/:id/spec`
- `POST /api/requests/:id/govern`
- `POST /api/requests/:id/approve-scope`
- `POST /api/requests/:id/manifest`
- `POST /api/builds`
- `GET /api/builds/:id`
- `PATCH /api/builds/:id/status`
- `POST /deploy`
- `GET /api/requests/:id/timeline`

Checks:

- `npm --workspace @agent-factory/factory-api test`
- API smoke script for a complete local request

## Lane 3: Coded Agent Runtime

Deliver:

- LangGraph-based coded agent package for the actual agentic reasoning path
- Fireworks model profiles
- LangSmith tracing
- JSON schemas for every agent output
- retry and repair logic

Suggested package:

- `services/agent-runtime`

Model profiles:

- `fast`: request classification, summary, UI copy
- `reasoning`: requirements, governance, ambiguity handling
- `code`: build planning and repair analysis
- `fallback`: high-reliability escalation

Environment:

```bash
FIREWORKS_API_KEY=
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=agent-factory-live
AGENT_MODEL_FAST=
AGENT_MODEL_REASONING=
AGENT_MODEL_CODE=
AGENT_MODEL_FALLBACK=
```

Checks:

- unit tests with mocked model calls
- schema validation tests
- LangSmith trace appears for a local request

## Lane 4: Build Worker Live Runner

Deliver:

- use the Build Worker Codex/Git runner adapter as the default execution seam
- create an isolated workspace for each run and write approved manifest/agent instructions into it
- gate live Codex invocation behind `BUILD_WORKER_CODEX_ENABLED=true`
- run a Codex readiness check before any workspace-write build
- call Codex with `workspace-write`, `--skip-git-repo-check`, JSON output, bounded output capture, and manifest-bounded repair attempts
- preserve `allowed_files_json` enforcement after Codex exits
- capture changed files, checks, redacted logs, local diff evidence, and release approval status
- optionally create GitHub PR evidence when `GITHUB_PAT_TOKEN` exists and a PR client/remote are configured

Important:

- keep generated output within manifest `allowed_files_json`
- redact secrets and PII from logs
- fail closed on forbidden files
- keep no-Codex and no-GitHub modes explicit: no Codex returns `blocked`; no GitHub returns local branch/diff evidence

Checks:

- `npm --workspace @agent-factory/build-worker test`
- `npm run smoke:build-worker`

## Lane 5: UiPath Live Activation

Deliver after explicit approval:

- publish/deploy Maestro orchestration
- deploy low-code and/or coded agents
- create Data Service entities
- configure Action Center tasks
- upload/run API Workflows
- optionally run Test Manager execution

Required preflight:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip llm-configuration byo-connections list-product-configs --product agents --output json
uip is connections list --output json
uip tm project list --filter AFQG --output json
```

Fireworks through UiPath:

- Use UiPath BYO LLM only if the target product/feature supports `OpenAiV1Compatible` for the needed model profile.
- Otherwise use Fireworks directly inside the hosted coded agent runtime and send sanitized trace/evidence back to UiPath.

## Lane 6: Hosted Preview

Deliver:

- publicly reachable Factory API for UiPath callbacks
- publicly reachable build-worker endpoint or queue bridge
- Customer360 sandbox preview URL
- env-based allowlist for production-disabled deployment

Options:

- Vercel preview
- Cloudflare Tunnel for local demo
- other approved cloud host

Checks:

- UiPath Cloud can reach health endpoints
- CORS and auth are configured
- production deploy remains disabled unless explicitly approved

## Lane 7: End-To-End Evidence

Deliver:

- `docs/live-demo-runbook.md`
- one recorded successful run
- screenshot set
- LangSmith trace link
- UiPath evidence IDs
- local and hosted URLs

Validation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

## Key Decisions Before Execution

1. Use direct Fireworks in our coded runtime, UiPath BYO LLM, or both?
2. Use Cloudflare Tunnel for fastest live demo, or Vercel for preview-hosted evidence?
3. Should build execution invoke Codex directly, generate via coded agent, or use a hybrid where agent plans and Codex edits?
4. Should Action Center live tasks be created during the demo, or should approval stay local until a final approved run?
5. Should GitHub PR creation be required, or is local branch/diff evidence acceptable?

## Recommended Path

Use both Fireworks and UiPath, but keep responsibilities separate:

- UiPath owns orchestration, approvals, audit, product governance, and Test Manager evidence.
- LangGraph coded agents own deep reasoning, model routing, retries, and tool decisions.
- Fireworks powers the coded agent model calls.
- LangSmith observes and evaluates agent behavior.
- Codex/Git owns code changes and reviewable build artifacts.

This gives the demo a real agentic core without making the user-facing UI look technical or overloaded.
