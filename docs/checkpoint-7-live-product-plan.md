# Checkpoint 7 Live Product Plan

Status: proposed execution plan. Do not run live UiPath mutations, live Test Cloud executions, paid live Codex runs, or production deployments until explicitly approved for the exact action.

Last updated: 2026-06-29

## Goal

Turn the Checkpoint 6 polished local product into a real Track 2 UiPath AgentHack product loop:

1. a business user submits a request,
2. an agent generates clarifying questions after submission,
3. the user answers only the missing facts,
4. agent runtime generates the plan, governance decision, and build manifest,
5. UiPath Maestro BPMN owns the live orchestration spine in Automation Cloud,
6. UiPath coordinates at least one human gate and one API/tool handoff where available,
7. Codex performs constrained code work from the approved manifest,
8. tests and deployment evidence are recorded,
9. the user opens a sandbox preview from the run.

The product should feel like the reference images in `Ui References/`: dark premium shell, simple navigation, conversational intake, plan/governance review, live run timeline, and a polished dashboard preview. Technical evidence should be available, but not the first thing a user sees.

## Critical Current Truth

| Area | Current truth | Checkpoint 7 correction |
|---|---|---|
| Clarifying questions | Factory Console still shows seeded questions and Factory API `/clarify` uses deterministic templates. | Generate questions after submit through the server-side agent runtime, with deterministic fallback clearly labeled. |
| UI lifecycle | Console submits intake and reads some API state, but much of the later flow still comes from seed data. | Wire the UI to the full request, timeline, approval, manifest, build, deploy, and preview lifecycle. |
| Fireworks/LangSmith | Server-side provider runtime exists for spec, governance, and build planning. | Extend it to clarification and wrap lifecycle steps in a real graph/run model. |
| Codex | Build Worker can run a Codex/Git runner but blocks unless `BUILD_WORKER_CODEX_ENABLED=true`. | Add a safe live-run profile and UI evidence for Codex readiness, execution, diff, tests, and blocked states. |
| UiPath | Orchestrator folder, Test Manager catalog, and an isolated solution-deployed Maestro process/release are live; a completed Maestro run still needs executable task bindings; Data Service, Action Center, Agents, API Workflows, and Apps remain import-ready or proposal-only. | Make Maestro BPMN the live Track 2 orchestration spine, with API Workflow, Action Center, Data Service, and Test Manager used as practical live evidence paths where available. |
| Hosting | Localhost proves the product locally, but UiPath Automation Cloud cannot call localhost. | Use a hosted endpoint or approved tunnel for Automation Cloud callbacks into Factory API and Build Worker. |
| Dashboard preview | Customer360 is runnable, but preview links were partly hardcoded to legacy ports before Checkpoint 7 planning. | Use environment-driven deployment URL and attach preview evidence to the run record. |

## Hackathon Requirement Reading

The user-provided Devpost page is the governing source for this checkpoint: <https://uipath-agenthack.devpost.com/>.

Key implications from the page review:

- Solutions should use UiPath as the execution and orchestration layer, not merely a decorative proof artifact.
- The most natural target for Agent Factory is Track 2: model and run an end-to-end business process using BPMN 2.0 in UiPath Maestro.
- A strong submission should show a working prototype, an end-to-end flow, clear architecture, involved agents, orchestration, human handoffs, and documentation.
- Bonus positioning exists for coding agents through UiPath for Coding Agents, including Codex. In this repo, Codex should be the bounded build worker, while UiPath remains the enterprise orchestration and governance layer.

Full analysis lives in `docs/hackathon-requirements-analysis.md`.

## Architecture Decision

Use a hybrid agent architecture. Fireworks does not replace Codex. Fireworks-powered agents decide, clarify, govern, and plan; Codex performs bounded repository edits; UiPath owns orchestration, human gates, test evidence, and audit.

```mermaid
flowchart LR
  user["Business user"] --> console["Factory Console"]
  console --> api["Factory API"]
  api --> graph["Agent graph runtime"]
  graph --> fireworks["Fireworks model profiles"]
  graph --> langsmith["LangSmith traces"]
  api --> maestro["UiPath Maestro BPMN run"]
  maestro --> action["Action Center / human gate"]
  maestro --> workflow["API Workflow callback"]
  maestro --> data["Data Service audit state"]
  maestro --> tests["Test Manager / Test Cloud evidence"]
  workflow --> api
  api --> worker["Build Worker"]
  worker --> codex["Codex CLI or SDK"]
  codex --> worktree["Isolated build workspace"]
  worker --> checks["Smoke/unit/build checks"]
  checks --> api
  api --> preview["Customer360 sandbox preview"]
  preview --> console
```

### Responsibility Split

| Layer | Responsibility | Why |
|---|---|---|
| Factory Console | Business-friendly request, plan, run, and output UI. | Keeps the product understandable for judges and users. |
| Factory API | Request state, lifecycle endpoints, provider calls, redacted audit, UiPath callback receiver. | Central control plane and future Data Service adapter. |
| LangGraph or graph runtime | Step orchestration, retries, branch decisions, human pauses, tool results. | Gives the agent path real state and transitions instead of one-off deterministic functions. |
| Fireworks | Fast, reasoning, code-planning, and fallback model profiles through server-side calls. | Good fit for OpenAI-compatible chat/tool calls and schema-driven model use. |
| LangSmith | Trace, latency, model selection, retry, tool-call, and evaluation evidence. | Observability and judge evidence; not product storage. |
| UiPath Maestro BPMN | Live request-to-release process orchestration in Automation Cloud. | This is the Track 2 requirement and the core enterprise control plane. |
| UiPath platform services | Action Center, Data Service, API Workflows, Orchestrator, Test Manager/Test Cloud where activated. | Provides human gates, system handoffs, audit state, and testing evidence. |
| Codex | Code understanding, edits, tests, repair attempts, diffs. | This is the frontier coding agent and should do the heavy repository work. |

## Research Notes

Sources used for this plan:

- UiPath AgentHack Devpost page reviewed from the user-provided link: <https://uipath-agenthack.devpost.com/>.
- Fireworks docs confirm OpenAI-compatible chat/tool calling and JSON-schema tool specifications: <https://docs.fireworks.ai/guides/function-calling> and <https://docs.fireworks.ai/api-reference/post-chatcompletions>.
- LangGraph docs position it as the graph/state-machine layer for agent workflows with models and tools: <https://docs.langchain.com/oss/javascript/langgraph/overview>.
- LangSmith docs support tracing through wrappers and traceable functions for nested LLM/tool spans: <https://docs.langchain.com/langsmith/observability-quickstart>.
- Official Codex manual was fetched locally through the OpenAI docs workflow. Relevant sections: `codex exec` for non-interactive runs, JSONL output, structured schema output, SDK control, worktrees, sandboxing, and approvals.
- UiPath local skill docs were used for live activation boundaries: `uipath-platform`, `uipath-agents`, `uipath-maestro-bpmn`, `uipath-api-workflow`, `uipath-human-in-the-loop`, `uipath-tasks`, and `uipath-skill-catalog`.

## Product UX Target

Use `Ui References/1.png` through `Ui References/4.png` as the north star.

### Screen 1: New Request

What the user sees:

- dark app shell with simple left nav,
- one conversational request composer,
- optional upload area for schema/sample data only,
- after submit, generated clarifying questions appear as cards,
- right rail shows request type, matched template, complexity, sensitivity.

What happens behind the scenes:

- `POST /api/requests` creates request,
- `POST /api/requests/:id/clarify` calls the agent runtime,
- Fireworks returns questions when configured,
- fallback questions are labeled as deterministic/degraded, not live.

### Screen 2: Build Plan And Governance

What the user sees:

- three-step review: Plan, Governance, Approvals,
- selected template, sources, metrics, outputs, refresh cadence,
- governance summary with data sensitivity and required approvals,
- clear `Approve plan` and `Request changes`.

What happens behind the scenes:

- answers are saved,
- requirements spec and governance are generated,
- approval task is created locally or via approved UiPath route,
- manifest is generated only after approval.

### Screen 3: Live Run

What the user sees:

- progress rail from intake to sandbox deployed,
- current stage, progress bar, live activity log,
- Maestro run id, human gate state, API Workflow callback, Codex worker state,
- right rail with branch/workspace, tests, guardrails, and deployment state.

What happens behind the scenes:

- UI polls request timeline and build status,
- Maestro BPMN owns the lifecycle order when live mode is enabled,
- Build Worker runs Codex only when enabled,
- checks and artifacts are captured,
- forbidden file changes block the run.

### Screen 4: Output Preview

What the user sees:

- dark premium Customer360 dashboard preview,
- sandbox badge and privacy-safe notice,
- KPI cards, charts, filters, and run-linked deployment metadata.

What happens behind the scenes:

- preview URL comes from deployment evidence,
- local dashboard uses synthetic/masked data by default,
- future hosted preview URL can be recorded through `/deploy`.

## Live UiPath Track 2 Strategy

Do not settle for a single side proof if Maestro can be made live. Checkpoint 7 should target a live Track 2 flow where Maestro BPMN is the process spine and the Factory app is the product surface.

Minimum target:

1. Host or tunnel the Factory API so Automation Cloud can reach it.
2. Publish or run the Maestro BPMN process after explicit approval.
3. Maestro owns the ordered lifecycle: intake, clarification, governance, scope approval, manifest, build handoff, quality evidence, release approval, sandbox deployment, audit closeout.
4. At least one API Workflow calls back into Factory API or Build Worker.
5. At least one human decision is visible, preferably through Action Center where activation allows it.
6. Record live UiPath identifiers in the Factory API timeline and UI evidence drawer.
7. Keep production deployment disabled; the output is a sandbox preview.

Strong stretch:

- Data Service mirrors durable request/run/audit state.
- Test Manager/Test Cloud records live test execution.
- UiPath Apps presents the operator surface, if app activation is faster than improving the existing console.

Can remain scoped or simulated if the live spine exists:

- arbitrary app generation beyond the Customer360 template,
- production customer-data connectors,
- deployment to a customer-facing prod environment,
- full public hosting for generated apps,
- every UiPath component running live in a single demo.

## Codex Live Build Strategy

Use Codex as a constrained build worker, not a freeform chatbot.

Required controls:

- isolated workspace per build,
- approved manifest written into the workspace,
- `allowed_files_json` enforced before and after Codex,
- `forbidden_actions_json` included in prompt and enforced in code,
- `codex exec --json` or Codex SDK event stream captured,
- workspace-write sandbox only,
- bounded repair attempts,
- redacted logs,
- blocked status when Codex auth/readiness fails,
- no secret-bearing environment variables exposed to untrusted build/test steps.

Initial demo scope should be deliberately small: generate or modify the Customer360 dashboard from an approved template and synthetic/sample schema. Do not promise arbitrary app generation until the guardrails, tests, and review path are stronger.

## What Users Can Upload

For the hackathon product, support safe upload semantics:

- allowed: CSV headers, data dictionary, sample synthetic CSV, requirements doc, brand/style notes,
- discouraged: raw real customer exports,
- blocked by default: secrets, credentials, direct identifiers, production data dumps.

The product should say "sample or schema" in the UI, not "upload your customer database."

## Checkpoint 7 Lanes

| Lane | Outcome | Primary paths |
|---|---|---|
| Agent Graph And Clarification | Live/provider-backed clarification plus graph-shaped lifecycle steps. | `services/factory-api`, `packages/shared-contracts`, tests |
| Product UI Live Flow | Reference-style UI wired to actual lifecycle endpoints and timeline. | `apps/factory-console` |
| Codex Worker Live Execution | Safe opt-in live Codex execution path with evidence and blocked states. | `services/build-worker`, docs |
| Maestro Cloud Orchestration | Live Track 2 Maestro BPMN orchestration with hosted/tunneled callbacks, API Workflow, human gate, and UiPath evidence ids. | `uipath/`, `docs/`, scripts |
| QA, Evidence, And Submission Runbook | Full checks, manual demo guide, truth table, screenshots, and risk register. | `docs/`, scripts |

## Acceptance Criteria

Checkpoint 7 is successful when:

- a new request starts from a blank/business-friendly UI,
- clarifying questions are generated after submit,
- the UI calls real lifecycle endpoints for answers, spec, governance, approval, manifest, build, deploy, and timeline,
- live provider mode is visibly different from deterministic fallback,
- Build Worker can either run Codex live or explain exactly why it is blocked,
- a real Maestro BPMN run, or an explicitly approved equivalent Track 2 Automation Cloud execution, is recorded with live UiPath identifiers,
- at least one UiPath API Workflow or human approval step is live and linked to the request timeline where platform activation allows it,
- `Open sandbox preview` uses the actual deployment URL,
- evidence is honest and redacted,
- the final demo runbook tells the user exactly what is live, local, import-ready, and approval-gated.

## Verification Target

Run after implementation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

Targeted checks:

```bash
npm --workspace @agent-factory/factory-api test
npm --workspace @agent-factory/build-worker test
npm --workspace @agent-factory/factory-console run typecheck
npm --workspace @agent-factory/factory-console run build
npm run smoke:build-worker
npm run smoke:customer360
```

Live checks require explicit approval:

```bash
uip login status --output json
uip tm project list --limit 5 --output json
uip maestro bpmn validate <approved BPMN asset> --output json
uip maestro bpmn <approved publish/run command>
uip api-workflow <approved run command>
uip tasks <approved Action Center command>
```

## Decisions Before Execution

1. Whether Checkpoint 7 may install `@langchain/langgraph` / LangSmith SDK dependencies, or whether to keep the current in-house graph wrapper for speed.
2. Whether to use Vercel preview, Cloudflare Tunnel, or another host for the UiPath-reachable endpoint.
3. Whether live Codex execution can be enabled with `BUILD_WORKER_CODEX_ENABLED=true` during the checkpoint.
4. Whether Action Center and Data Service are approved as live writes after the first Maestro/API Workflow activation check.
