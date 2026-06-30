# Governed Agentic Automation Factory

## Project Description

Governed Agentic Automation Factory is a UiPath AgentHack submission that turns a business request into a governed coding-agent build. A user asks for an internal business app, such as a Customer360 analytics dashboard, and the request moves through clarification, governance, approval, build planning, worker handoff, quality checks, release approval, sandbox preview, and audit evidence.

The problem it solves is enterprise trust around AI-generated internal software. Coding agents can produce apps quickly, but enterprises still need ownership, approved data scope, PII policy, human decisions, tests, release control, and an audit trail. Agent Factory keeps the speed of coding agents while making UiPath the process and governance layer around them.

The core demo flow is:

```text
business request -> AI clarifications -> governance -> scope approval
  -> approved build manifest -> constrained Codex worker -> tests
  -> release approval -> Customer360 sandbox preview -> evidence ledger
```

The Customer360 dashboard is the proof artifact. The product is the governed factory that lets an enterprise own what the coding agent builds.

The repository is the production implementation for the submission package, not a cached demo. It intentionally separates what is live in UiPath Automation Cloud from what is import-ready, proposal-only, or locally simulated.

## UiPath Components

| UiPath component | Role in Agent Factory | Repository evidence |
|---|---|---|
| Maestro BPMN | Request-to-release orchestration spine for intake, agent work, human gates, API handoffs, testing, deployment, and audit. | `uipath/maestro/customer360-build/` |
| Agent Builder / UiPath Agents | Requirements, Clarification, Governance, Build Planner, and Test Summary agents. | `uipath/agents/AgentFactoryAgents/` |
| Coded Agents / external coded runtime | Server-side agent runtime and Build Worker contract for model-backed clarification/planning and constrained coding-agent work. | `services/factory-api`, `services/build-worker` |
| UiPath for Coding Agents | Codex activation path and worker contract for coding-agent execution inside approved scope. | `services/build-worker`, `docs/uipath-setup.md` |
| Action Center | Scope/data approval and release approval gates. | `uipath/action-center/` |
| API Workflows / Integration Service | StartBuildWorker, FetchBuildStatus, PostStatusUpdate, RecordTestResult, StartDeployment, and RecordUiPathEvent handoffs. | `uipath/api-workflows/` |
| Data Service | Proposed durable state and audit schema for requests, manifests, approvals, tests, deployments, and platform evidence. | `uipath/data-service/schema.json` |
| Orchestrator | Automation Cloud folder, assets, process visibility, and runtime boundary. | `uipath/README.md`, `docs/uipath-setup.md` |
| Test Manager / Test Cloud | Quality-gate project, release test set, and seven Customer360 release test cases. | `uipath/test-cloud/quality-gate-assets.json` |
| UiPath Apps | Companion intake/status contract for a future low-code operator surface. | `uipath/apps/` |

Automation Cloud environment used for build and verification:

```text
https://cloud.uipath.com/galacticus/DefaultTenant/
```

## Agent Type

This solution uses **both low-code agents and coded agents**.

- **Low-code UiPath Agents:** Requirements Agent, Clarification Agent, Governance Agent, Build Planner Agent, and Test Summary Agent are represented as UiPath Agent Builder assets under `uipath/agents/AgentFactoryAgents/`.
- **Coded agents / coded runtime:** The Factory API agent runtime uses model-backed lifecycle endpoints for clarification, requirements/spec generation, governance, and build planning. The Build Worker exposes the coded execution contract for manifest validation, Codex worker handoff, status evidence, guardrails, tests, and sandbox deployment evidence.
- **Coding agent:** Codex is used through a manifest-constrained worker pattern. The agent receives approved metrics, allowed files, forbidden actions, PII policy, sandbox-only deployment rules, and repair limits instead of an unconstrained prompt.

## Setup Instructions For Judges

### 1. Prerequisites

- Node.js 22+
- npm 10+
- Git
- Optional for platform verification: UiPath CLI authenticated to `galacticus / DefaultTenant`
- Optional for live provider mode: Fireworks and LangSmith keys configured in local, git-ignored environment files
- Optional for live coding-agent execution: authenticated OpenAI Codex CLI

### 2. Install dependencies

```bash
npm install
```

### 3. Run the full local verification suite

```bash
npm run smoke
```

This builds the workspaces and runs the available tests, including Customer360 metric and PII guardrail coverage.

### 4. Start the complete demo stack

```bash
npm run setup:live
```

```bash
npm run dev:live
```

`dev:live` starts the local product stack on these default ports:

| Surface | URL |
|---|---|
| Factory API health | `http://localhost:8887/health` |
| Build Worker health | `http://localhost:8890/health` |
| Factory Console | `http://localhost:5183` |
| Customer360 dashboard | `http://localhost:5184` |

### 5. Judge the product flow

1. Open `http://localhost:5183`.
2. Submit a Customer360 business request.
3. Review generated clarification questions.
4. Generate the build plan.
5. Inspect governance, approval, and build manifest details.
6. Approve scope.
7. Watch the Live Run lifecycle.
8. Approve release.
9. Open the Customer360 sandbox preview.
10. Inspect evidence: manifest, audit timeline, API state, platform evidence, quality evidence, and worker contract.

### 6. Optional UiPath verification commands

These commands are read-only or validation-oriented and help judges inspect the UiPath layer when the CLI is authenticated:

```bash
npm run uipath:live-plan
npm run uipath:readiness
uip login status --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip tm testsets list --project-key AFQG --output json
```

Do not run Data Service creation, Maestro publish/run, Agent upload/deploy, API Workflow runtime calls, Action Center task completion, UiPath Apps publish/deploy, production deploys, or live Test Manager executions unless you explicitly intend to mutate Automation Cloud resources.

## Current Status

| Area | Current truth |
|---|---|
| Local Factory Console/API | Runnable local product flow for intake, clarification, governance, scope approval, live run progress, output preview, deployment evidence, and audit timeline. |
| Customer360 dashboard | Runnable React/Vite dashboard with synthetic data, masked PII, refresh/degraded/empty states, and metric tests. |
| Build Worker | Runnable service contract for `/build` and `/build/:id`; default runtime blocks honestly, and the approved 2026-06-29 activation passed live Codex readiness/build in an isolated workspace. |
| Fireworks/LangSmith | Provider-ready through local/deployment configuration. Provider values and trace payloads must stay out of git, docs, screenshots, and logs. |
| Test Manager/Test Cloud | Live Test Manager project `Agent Factory Quality Gates`, test set `Customer360 Release Gate`, and seven test cases. No live execution has been run. |
| Data Service | Proposal-only schema in `uipath/data-service/schema.json`; entity/choice-set creation requires explicit approval. |
| Maestro | BPMN source validates and was solution-deployed live; current patched candidate is `AgentFactoryDemoLiveSpine 1` with process `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1`. No runtime process instance is claimed because `process run` still fails before instance/job/task creation. |
| Agents/API Workflows | Validated/import-ready local assets, including a live-evidence callback workflow and trusted bridge token header support; `AgentFactory_StartBuildWorker` ran through the local UiPath API Workflow runner, while cloud packaging/upload remains unresolved. |
| Action Center/UiPath Apps | Proposal-only contracts; task/app creation, completion, publish, or deploy requires approval. |
| Deployment | Sandbox/local dashboard run is available. `AgentFactory_StartDeployment` targets the local `POST /deploy` sandbox endpoint for deployment evidence. |

## Demo Story

The five-minute demo is:

```text
request -> clarifications -> governance -> scope approval -> manifest -> build worker
  -> tests -> release approval -> sandbox dashboard -> audit
```

Use [docs/live-demo-runbook.md](docs/live-demo-runbook.md) for the Checkpoint 7 demo runbook, [docs/demo-script.md](docs/demo-script.md) for the timed script, and [docs/submission-checklist.md](docs/submission-checklist.md) for the current readiness checklist.

## Quick Start

Prerequisites:

- Node.js 22+
- npm 10+
- OpenAI Codex CLI 0.142+
- UiPath CLI authenticated to `galacticus / DefaultTenant` for platform checks
- GitHub CLI authenticated if PR evidence is enabled
- Vercel CLI authenticated only if a sandbox deployment lane provides hosted deploy commands

Install and verify:

```bash
npm install
npm run smoke
```

For Checkpoint 7 local provider rehearsal, create git-ignored local configuration and start the full stack:

```bash
npm run setup:live
```

```bash
npm run dev:live
```

`dev:live` defaults to `8887`, `8890`, `5183`, and `5184`. It prints the active URLs when it starts.

The older separate-terminal path remains available after `npm run smoke` or `npm run build` has created service `dist/` output:

```bash
npm run dev:api
```

```bash
npm run dev:worker
```

```bash
npm run dev:console
```

```bash
npm run dev:customer360
```

Preferred `dev:live` local URLs:

| Surface | URL |
|---|---|
| Factory API | `http://localhost:8887/health` |
| Build Worker | `http://localhost:8890/health` |
| Factory Console | `http://localhost:5183` |
| Customer360 dashboard | `http://localhost:5184` |

The separate-terminal commands use their own package defaults: Factory API `8787`,
Build Worker `8790`, Factory Console `5173`, and Customer360 `5174`.

## Verification

Recommended local checks before a submission handoff:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
git diff --check
```

Useful targeted checks:

```bash
npm run smoke:customer360
npm run smoke:build-worker
npm run uipath:live-plan
npm run uipath:readiness
uip login status --output json
uip tm project list --limit 5 --output json
```

Do not run Data Service creation, Maestro publish/run, Agent upload/deploy, API Workflow runtime calls, Action Center task completion, UiPath Apps publish/deploy, production deploys, or live Test Manager executions without explicit approval for the exact action.

## UiPath Usage

| UiPath product | Role in the solution |
|---|---|
| Maestro BPMN | Lifecycle owner for intake, clarification, governance, approvals, build, tests, release, deployment, and audit. |
| UiPath Agents / Agent Builder | Requirements, Clarification, Governance, Build Planner, and Test Summary agents. |
| Action Center | Scope/data approval and release approval decision gates. |
| Data Service | Proposed state and audit system of record. |
| API Workflows / Integration Service | Import-ready calls to Build Worker, status polling, test recording, and deployment start. |
| Orchestrator | Folder, assets, credentials, jobs, and process visibility. |
| Test Manager/Test Cloud | Live quality-gate catalog for Customer360 release evidence. |
| UiPath Apps | Proposal-only companion intake/status surface. |
| UiPath for Coding Agents | Local Codex skill activation path through `uip skills install --agent codex --local`. |

See [docs/uipath-setup.md](docs/uipath-setup.md) and [docs/component-map.md](docs/component-map.md) for exact file paths, IDs, and approval boundaries.

## Repository Map

| Path | Purpose |
|---|---|
| `apps/factory-console` | Operator-facing request, governance, quality, deployment, and audit console. |
| `apps/customer360-template` | Generated-dashboard target with synthetic Customer360 analytics. |
| `services/factory-api` | Local lifecycle API and in-memory store shaped for Data Service. |
| `services/build-worker` | Worker API, manifest validation, Codex command contract, guardrails, and status evidence. |
| `packages/shared-contracts` | Shared lifecycle schemas and runtime contracts. |
| `packages/customer360-metrics` | Deterministic analytics, PII masking, mutation, and metric tests. |
| `uipath/` | Maestro, Data Service, Agents, API Workflow, Action Center, Apps, and Test Manager assets. |
| `docs/` | Setup, demo script, Devpost copy, component map, and platform runbooks. |

## Submission Docs

- [Setup](docs/setup.md)
- [Checkpoint 7 live demo runbook](docs/live-demo-runbook.md)
- [UiPath live spine activation](docs/uipath-live-spine-activation.md)
- [Demo script](docs/demo-script.md)
- [Devpost copy](docs/devpost-submission.md)
- [Submission deck](AgentFactory_Submission_Deck.pptx)
- [Component map](docs/component-map.md)
- [Submission checklist](docs/submission-checklist.md)
- [UiPath setup and platform mapping](docs/uipath-setup.md)

## License

MIT. See [LICENSE](LICENSE).
