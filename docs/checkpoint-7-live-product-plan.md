# Checkpoint 7 Live Product Plan

Status: proposed execution plan. Do not run live UiPath mutations, live Test Cloud executions, or production deployments until explicitly approved for the exact action.

Last updated: 2026-06-29

## Goal

Turn the Checkpoint 6 polished local product into a real live product loop:

1. a business user submits a request,
2. an agent generates clarifying questions after submission,
3. the user answers only the missing facts,
4. agent runtime generates the plan, governance decision, and build manifest,
5. UiPath gates the run through at least one real live proof,
6. Codex performs constrained code work from the approved manifest,
7. tests and deployment evidence are recorded,
8. the user opens a sandbox preview from the run.

The product should feel like the reference images in `Ui References/`: dark premium shell, simple navigation, conversational intake, plan/governance review, live run timeline, and a polished dashboard preview. Technical evidence should be available, but not the first thing a user sees.

## Critical Current Truth

| Area | Current truth | Checkpoint 7 correction |
|---|---|---|
| Clarifying questions | Factory Console still shows seeded questions and Factory API `/clarify` uses deterministic templates. | Generate questions after submit through the server-side agent runtime, with deterministic fallback clearly labeled. |
| UI lifecycle | Console submits intake and reads some API state, but much of the later flow still comes from seed data. | Wire the UI to the full request, timeline, approval, manifest, build, deploy, and preview lifecycle. |
| Fireworks/LangSmith | Server-side provider runtime exists for spec, governance, and build planning. | Extend it to clarification and wrap lifecycle steps in a real graph/run model. |
| Codex | Build Worker can run a Codex/Git runner but blocks unless `BUILD_WORKER_CODEX_ENABLED=true`. | Add a safe live-run profile and UI evidence for Codex readiness, execution, diff, tests, and blocked states. |
| UiPath | Orchestrator folder and Test Manager catalog are live; Maestro, Data Service, Action Center, Agents, API Workflows, and Apps are import-ready or proposal-only. | Add one narrow live UiPath proof before broader mutation: preferably an API Workflow or Action Center route against a hosted/tunneled Factory API. |
| Hosting | Localhost proves the product locally, but UiPath Cloud cannot call localhost. | Use a hosted endpoint or approved tunnel for the live proof. |
| Dashboard preview | Customer360 is runnable, but preview links were partly hardcoded to legacy ports. | Use environment-driven deployment URL and attach preview evidence to the run record. |

## Architecture Decision

Use a hybrid agent architecture. Fireworks does not replace Codex. Fireworks-powered agents decide, clarify, govern, and plan; Codex performs bounded repository edits; UiPath owns orchestration, human gates, test evidence, and audit.

```mermaid
flowchart LR
  user["Business user"] --> console["Factory Console"]
  console --> api["Factory API"]
  api --> graph["Agent graph runtime"]
  graph --> fireworks["Fireworks model profiles"]
  graph --> langsmith["LangSmith traces"]
  api --> uipath["UiPath live proof"]
  uipath --> api
  api --> worker["Build Worker"]
  worker --> codex["Codex CLI or SDK"]
  codex --> worktree["Isolated build workspace"]
  worker --> tests["Smoke/unit/build checks"]
  tests --> api
  api --> preview["Customer360 sandbox preview"]
  preview --> console
```

### Responsibility Split

| Layer | Responsibility | Why |
|---|---|---|
| Factory Console | Business-friendly request, plan, run, and output UI. | Keeps the product understandable for judges and users. |
| Factory API | Request state, lifecycle endpoints, provider calls, redacted audit. | Central local control plane and future Data Service adapter. |
| LangGraph or graph runtime | Step orchestration, retries, branch decisions, human pauses, tool results. | Gives the agent path real state and transitions instead of one-off deterministic functions. |
| Fireworks | Fast, reasoning, code-planning, and fallback model profiles through server-side calls. | Good fit for OpenAI-compatible chat/tool calls and schema-driven model use. |
| LangSmith | Trace, latency, model selection, retry, tool-call, and evaluation evidence. | Observability and judge evidence; not product storage. |
| Codex | Code understanding, edits, tests, repair attempts, diffs. | This is the frontier coding agent and should do the heavy repository work. |
| UiPath | Governance, enterprise workflow, human approvals, API workflows, Test Manager, audit. | This is the hackathon differentiator and the enterprise control plane. |

## Research Notes

Sources used for this plan:

- Fireworks docs confirm OpenAI-compatible chat/tool calling and JSON-schema tool specifications: <https://docs.fireworks.ai/guides/function-calling> and <https://docs.fireworks.ai/api-reference/post-chatcompletions>.
- LangGraph docs position it as the graph/state-machine layer for agent workflows with models and tools: <https://docs.langchain.com/oss/javascript/langgraph/overview>.
- LangSmith docs support tracing through wrappers and traceable functions for nested LLM/tool spans: <https://docs.langchain.com/langsmith/observability-quickstart>.
- Official Codex manual was fetched locally through the OpenAI docs workflow. Relevant sections: `codex exec` for non-interactive runs, JSONL output, structured schema output, SDK control, worktrees, sandboxing, and approvals.
- UiPath local skill docs were used for live activation boundaries: `uipath-platform`, `uipath-agents`, and `uipath-skill-catalog`. Public `docs.uipath.com` pages returned 403 from the shell fetch, so the executable `uip` CLI and repo-local UiPath docs remain the practical source of truth.
- No reliable public AgentHack requirements page was found by search in this session. Treat repo docs and any user-provided hackathon URL as the current submission truth.

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
- right rail with branch/workspace, tests, guardrails, and deployment state.

What happens behind the scenes:

- UI polls request timeline and build status,
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

## Live UiPath Proof Strategy

Do not try to make every UiPath asset live at once. That creates more risk than value.

Recommended minimum live proof:

1. Host or tunnel the Factory API so UiPath Cloud can reach it.
2. Run one UiPath API Workflow against that endpoint, ideally `AgentFactory_StartBuildWorker` or `AgentFactory_StartDeployment`.
3. Record the UiPath execution/run identifier in the Factory API timeline.
4. Show the timeline event and UiPath identifier in the evidence drawer.

Stretch live proof:

- create one Action Center approval task for scope approval,
- complete it manually,
- store task id and decision in the run,
- optionally mirror state into Data Service.

Hold until later:

- full Maestro publish/run,
- full UiPath Apps deployment,
- full Test Cloud execution,
- production release.

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
| UiPath Live Proof And Hosted Bridge | One approved live UiPath proof against a reachable endpoint or documented final approval path. | `uipath/`, `docs/`, scripts |
| QA, Evidence, And Submission Runbook | Full checks, manual demo guide, truth table, screenshots, and risk register. | `docs/`, scripts |

## Acceptance Criteria

Checkpoint 7 is successful when:

- a new request starts from a blank/business-friendly UI,
- clarifying questions are generated after submit,
- the UI calls real lifecycle endpoints for answers, spec, governance, approval, manifest, build, deploy, and timeline,
- live provider mode is visibly different from deterministic fallback,
- Build Worker can either run Codex live or explain exactly why it is blocked,
- at least one real UiPath execution/proof id is recorded, or the plan stops before that with explicit user approval still required,
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
uip api-workflow run <approved workflow command>
```

## Decisions Before Execution

1. Whether Checkpoint 7 may install `@langchain/langgraph` / LangSmith SDK dependencies, or whether to keep the current in-house graph wrapper for speed.
2. Whether to use Vercel preview, Cloudflare Tunnel, or another host for the UiPath-reachable endpoint.
3. Whether live Codex execution can be enabled with `BUILD_WORKER_CODEX_ENABLED=true` during the checkpoint.
4. Which UiPath live proof is approved first: API Workflow execution, Action Center task, or Data Service record.
5. Whether the demo should create a GitHub PR or use local branch/diff evidence.
