# Live Agentic Architecture

Status: planning draft for the post-Checkpoint 5 live build.

## Current Truth

Checkpoint 5 proves the product shape, but it is not yet a fully live agentic system.

- Factory Console runs locally and calls Factory API health/intake.
- Factory API has lifecycle endpoints for intake, clarification, spec, governance, approval, manifest, build queue, build status, deploy, and timeline.
- Build Worker has a validated HTTP surface and a runner abstraction, but the default runner blocks unless a real Codex/Git runner is injected.
- Customer360 is a local generated-dashboard target with deterministic synthetic data.
- UiPath Test Manager catalog is live.
- UiPath Maestro, Agents, Data Service, Action Center, API Workflows, and UiPath Apps are source-controlled or import-ready, but not published/running as the live orchestration path.

The next build should turn this into a real run system where the UI starts a request and watches actual backend, agent, UiPath, build, test, and deploy events.

## Target Architecture

```mermaid
flowchart LR
  user["Business user"] --> console["Agent Factory Console"]
  console --> api["Factory API"]
  api --> state["Run state store"]
  api --> orchestrator["UiPath Maestro"]
  orchestrator --> reqAgent["Requirements Agent"]
  orchestrator --> govAgent["Governance Agent"]
  orchestrator --> action["Action Center approvals"]
  orchestrator --> manifestAgent["Build Planner Agent"]
  orchestrator --> workerFlow["API Workflow: StartBuildWorker"]
  workerFlow --> buildWorker["Build Worker"]
  buildWorker --> graph["Coded Agent Runtime"]
  graph --> fireworks["Fireworks models"]
  graph --> codex["Codex/Git workspace"]
  buildWorker --> tests["Local tests + Test Manager evidence"]
  orchestrator --> deployFlow["API Workflow: StartDeployment"]
  deployFlow --> preview["Sandbox preview"]
  api --> langsmith["LangSmith traces/evals"]
  api --> console
```

## Agent Strategy

Use a mixed UiPath strategy:

- Low-code UiPath agents remain useful for simple, auditable policy and schema-bound steps.
- Coded UiPath agents should handle the real agentic work where we need LangGraph, model routing, retries, tool calls, and observability.
- Maestro stays the governed orchestration layer.
- Data Service becomes the durable state/audit store once live mutation is approved.
- Action Center stays the human decision surface for scope and release approval.

Recommended agent split:

| Agent | Runtime | Purpose |
|---|---|---|
| Intake Classifier | Coded LangGraph | Classify request, match template, infer missing info, score complexity |
| Requirements Agent | Coded LangGraph or low-code | Turn intake and answers into a structured spec |
| Governance Agent | Low-code or coded | Risk tier, PII policy, forbidden actions, approval requirements |
| Build Planner Agent | Coded LangGraph | Produce strict manifest and build instructions |
| Build Worker Agent | Coded LangGraph plus Codex runner | Execute build, inspect diffs, repair failures |
| Test Summary Agent | Coded LangGraph | Summarize smoke/unit/build/Test Manager evidence |
| Release Advisor | Low-code or coded | Prepare Action Center release approval summary |

## Fireworks Usage

Fireworks is best used in the coded agent runtime, not directly inside the user-facing UI.

Initial model allocation, to verify against Fireworks model availability before implementation:

| Use | Model class | Why |
|---|---|---|
| Fast classification and UI copy | Llama/Qwen small instruct model on Fireworks | Low latency and low cost |
| Structured spec and governance reasoning | DeepSeek V3.1 or Qwen/Kimi instruct model | Strong JSON/task reasoning |
| Build planning and repair analysis | Kimi K2 or DeepSeek class model | Tool-use and code reasoning |
| Test summarization | Cost-efficient instruct model | Summaries are bounded and schema-heavy |
| Hard failures or ambiguous specs | Premium fallback model via UiPath LLM Gateway or direct provider | Higher reliability only when needed |

Fireworks supports OpenAI-compatible Chat Completions and tool/function calling, so the coded runtime can use either:

- direct Fireworks calls with `base_url=https://api.fireworks.ai/inference/v1`, or
- a LangChain/OpenAI-compatible client wrapped inside LangGraph.

Do not bake model IDs into UI text. Store them in server config and expose only "fast", "reasoning", and "code" profiles to the product layer.

## LangGraph Usage

Use LangGraph for the coded agent runtime because it gives us a real state machine:

- nodes for classify, clarify, spec, govern, plan, build, test, summarize
- conditional transitions
- retries and repair loops
- human-in-the-loop pauses
- durable run state
- per-node model routing

The UI should not expose LangGraph internals. It should show user-friendly states like "Clarifying requirements", "Checking policy", "Building preview", and "Running quality gates".

## LangSmith Usage

LangSmith should be used for observability and evaluation, not as the product state store.

Track:

- one trace per Agent Factory request
- child runs per graph node and model call
- prompt version, model, latency, token usage, cost, retries, tool calls
- evaluation datasets for intake classification, PII guardrails, manifest correctness, and build repair quality

Required environment:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=<key>
LANGSMITH_PROJECT=agent-factory-live
```

## UiPath Live Activation

Live activation needs explicit approval because it mutates Automation Cloud:

1. Publish/deploy Maestro process.
2. Upload/deploy agents or coded agents.
3. Create Data Service schema and initial records.
4. Create Action Center task routes.
5. Upload/run API Workflows.
6. Optionally execute Test Manager/Test Cloud runs.
7. Host Factory API and Build Worker somewhere UiPath Cloud can reach.

Localhost is not enough for real UiPath Cloud callbacks. Use Vercel, Cloudflare Tunnel, or another approved public preview endpoint for the API and build-worker surfaces.

## Required Credentials

Minimum live path:

- `FIREWORKS_API_KEY`
- `LANGSMITH_API_KEY`
- UiPath CLI login or service principal credentials
- hosted API base URL
- Codex authenticated locally or configured runner environment

Useful but optional:

- `GITHUB_PAT_TOKEN` for PR creation
- Vercel token/team/project IDs for hosted preview deployment
- UiPath Integration Service connection IDs for live vendor/API calls

## Configuration Boundary

Never commit credentials. Store them in local `.env` or deployment secrets.

Add typed config validation before live implementation:

- fail fast if a required live key is missing
- expose degraded mode clearly in API and UI
- make local simulation an explicit mode, not a silent fallback

## Research References

- Fireworks function calling: https://docs.fireworks.ai/guides/function-calling
- Fireworks docs: https://docs.fireworks.ai/
- LangGraph overview: https://docs.langchain.com/oss/javascript/langgraph/overview
- LangSmith observability: https://docs.smith.langchain.com/observability
- LangSmith OpenAI-compatible tracing: https://docs.langchain.com/langsmith/trace-openai-compatible
- UiPath Python SDK: https://uipath.github.io/uipath-python/
- Local UiPath skill notes: `.agents/skills/uipath-agents`, `.agents/skills/uipath-platform`
