# Governed Agentic Automation Factory

UiPath AgentHack submission for a governed factory that turns a business request into a constrained coding-agent build. A user asks for a Customer360 analytics dashboard, UiPath-shaped agents clarify and govern the request, approval gates control scope and release, a Codex worker contract builds from a manifest, tests gate the result, and audit evidence shows what happened.

The repository is the production implementation for the submission package, not a cached demo. It intentionally separates what is live in UiPath Automation Cloud from what is import-ready, proposal-only, or locally simulated.

## Current Status

| Area | Current truth |
|---|---|
| Local Factory Console/API | Runnable local product flow for intake, clarification, governance, scope approval, live run progress, output preview, deployment evidence, and audit timeline. |
| Customer360 dashboard | Runnable React/Vite dashboard with synthetic data, masked PII, refresh/degraded/empty states, and metric tests. |
| Build Worker | Runnable service contract for `/build` and `/build/:id`; default runtime blocks honestly until a live Codex/Git runner is injected. |
| Fireworks/LangSmith | Provider-ready through local/deployment configuration. Provider values and trace payloads must stay out of git, docs, screenshots, and logs. |
| Test Manager/Test Cloud | Live Test Manager project `Agent Factory Quality Gates`, test set `Customer360 Release Gate`, and seven test cases. No live execution has been run. |
| Data Service | Proposal-only schema in `uipath/data-service/schema.json`; entity/choice-set creation requires explicit approval. |
| Maestro | Validated, import-ready BPMN project; not published or run until approval. |
| Agents/API Workflows | Validated/import-ready local assets; not uploaded, deployed, or run until approval. |
| Action Center/UiPath Apps | Proposal-only contracts; task/app creation, completion, publish, or deploy requires approval. |
| Deployment | Sandbox/local dashboard run is available. `AgentFactory_StartDeployment` targets the local `POST /deploy` sandbox endpoint for deployment evidence. |

## Demo Story

The five-minute demo is:

```text
request -> clarifications -> governance -> scope approval -> manifest -> build worker
  -> tests -> release approval -> sandbox dashboard -> audit
```

Use [docs/live-demo-runbook.md](docs/live-demo-runbook.md) for the Checkpoint 6 runbook, [docs/demo-script.md](docs/demo-script.md) for the timed script, and [docs/submission-checklist.md](docs/submission-checklist.md) for the current readiness checklist.

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

For Checkpoint 6 local provider rehearsal, create git-ignored local configuration and start the full stack:

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
- [Checkpoint 6 live demo runbook](docs/live-demo-runbook.md)
- [Demo script](docs/demo-script.md)
- [Devpost copy](docs/devpost-submission.md)
- [Component map](docs/component-map.md)
- [Submission checklist](docs/submission-checklist.md)
- [UiPath setup and platform mapping](docs/uipath-setup.md)

## License

MIT. See [LICENSE](LICENSE).
