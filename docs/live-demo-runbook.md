# Checkpoint 7 Live Demo Runbook

Last updated: 2026-06-29

This is the judge-facing Checkpoint 7 path for Agent Factory. The demo story is simple: a business user requests a Customer360 dashboard, agent steps clarify and govern the request, a human approval gates scope, a constrained Codex worker contract builds or blocks honestly, quality checks run, and a sandbox preview plus audit evidence close the loop. UiPath is presented as the orchestration and governance layer, with live claims limited to assets that were actually verified.

## Final Truth Table

| Layer | Status | What to say |
|---|---|---|
| Factory Console | Local runnable | Operator UI for intake, generated clarifications, governance review, approvals, live run progress, sandbox preview, and evidence. |
| Factory API | Local runnable, trusted bridge ready | Lifecycle API for requests, graph metadata, approvals, manifests, build/deploy callbacks, and audit state. `uipath-live` callback mutations support `AGENT_FACTORY_BRIDGE_TOKEN` via `x-agent-factory-bridge-token`. |
| Build Worker | Local runnable, trusted bridge ready, live Codex evidence exists | Validates governed manifests and records build evidence. Default mode blocks unless `BUILD_WORKER_CODEX_ENABLED=true`; the approved 2026-06-29 activation passed live Codex readiness/build in an isolated workspace. Build/status routes can require the bridge token. |
| Customer360 dashboard | Local runnable | Sandbox output with synthetic data, masked PII, refresh/degraded/empty states, and quality checks. |
| Fireworks | Provider-ready | Server-side model profiles can generate clarification/spec/governance/planning outputs when configured; fallback is labeled deterministic/degraded. |
| LangSmith | Provider-ready | Trace/evaluation evidence only. Share links only after payloads are reviewed and sanitized. |
| UiPath Orchestrator | Live folder evidence from platform setup | Folder/runtime context exists; jobs, assets, and process mutations remain approval-gated. |
| UiPath Test Manager/Test Cloud | Live catalog, no execution | Project `AFQG` and seven test cases are live. No live Test Cloud execution has been run. |
| Maestro BPMN | Live solution-deployed process, no completed run | Track 2 BPMN validates. Current patched solution deployment is process `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1` in isolated folder `AgentFactoryDemoLiveSpine 1`; earlier `1.0.0` remains in `AgentFactoryDemoLiveSpine`. Runtime run still fails before instance/job/task creation, so no live Maestro run is claimed. |
| API Workflows | Validated/import-ready, local runner exercised, bridge-token ready | Six workflow assets validate locally, including `AgentFactory_RecordUiPathEvent`; `AgentFactory_StartBuildWorker` successfully ran through the local UiPath API Workflow runner against `127.0.0.1`. Cloud packaging/upload is not claimed. |
| UiPath Agents | Validated/import-ready | Five low-code Agent projects validate locally; upload/deploy/run requires approval. |
| Action Center | Proposal-only contract | Scope/data and release gates are modeled; no live task is claimed until a real task id exists. |
| Data Service | Proposal-only schema | Source-controlled schema only; no entity or record writes without approval. |
| UiPath Apps | Proposal-only contract | Companion app concept only; no app is packed, published, or deployed. |

## Setup

Install dependencies and run the final local gate:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

For local provider rehearsal, write git-ignored configuration and start the stack:

```bash
npm run setup:live
npm run dev:live
```

`dev:live` builds the shared packages and services, then starts:

| Surface | Default URL |
|---|---|
| Factory API | `http://localhost:8887` |
| Build Worker | `http://localhost:8890` |
| Factory Console | `http://localhost:5183` |
| Customer360 dashboard | `http://localhost:5184` |

Use the URLs printed by the dev servers as the source of truth. The separate package commands remain available after build output exists: `npm run dev:api`, `npm run dev:worker`, `npm run dev:console`, and `npm run dev:customer360`.

## Safe UiPath Evidence Checks

These checks are read-only or local validation. They do not publish, run, create tasks, write Data Service records, or execute Test Cloud gates:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
npm run uipath:live-plan
npm run uipath:readiness
```

Checkpoint 7 final QA evidence:

| Check | Result |
|---|---|
| UiPath login | Logged in to `https://cloud.uipath.com`, organization `galacticus`, tenant `DefaultTenant`. |
| Orchestrator folder | `AgentFactoryDemo` exists with folder id `7986306`. |
| Isolated solution folders | `AgentFactoryDemoLiveSpine` id `7989131` has the historical `1.0.0` deployment; `AgentFactoryDemoLiveSpine 1` id `7989142` has the current patched `1.0.1` deployment. |
| Test Manager project | `AFQG` / `Agent Factory Quality Gates` exists and is active. |
| Test cases | Seven cataloged test cases exist: `AF-QG-001` through `AF-QG-007`. |
| Maestro BPMN validation | `agent-factory-customer360-build.bpmn` is valid with one process and one start event; solution deployment is live, runtime run is not. |
| API Workflow validation | Six workflows validate, including `AgentFactory_RecordUiPathEvent`, and all accept `bridgeToken`. |

## Manual Demo Script

Use this request:

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

1. Setup
   Start `npm run dev:live`, open the Factory Console, and keep a terminal with `npm run smoke:demo` evidence available. Say that the demo is local/sandbox unless a specific live UiPath approval has been executed.

2. Submit request
   Paste the Customer360 request and submit it from the new request surface. Verify the request appears with lifecycle state and no seeded walkthrough is required.

3. Answer generated clarifications
   Show the post-submit questions for sources, metrics, filters, PII handling, refresh cadence, and approval owner. If provider keys are configured, note the provider-backed mode; otherwise say the deterministic/degraded fallback is labeled in metadata.

4. Review plan and governance
   Open the build plan/governance view. Point to approved sources, Customer360 template, metrics, masked PII policy, allowed files, forbidden actions, sandbox-only deployment, and required approvals.

5. Approve scope
   Use the local approval control. Say this is the local approval implementation unless a live Action Center task id has been created by an explicitly approved run.

6. Build or explain current build evidence
   Start the build handoff. In default mode, show the Build Worker blocked/readiness evidence. For the 2026-06-29 activation, show `BUILD-REQ-2026-001-001`, Codex readiness session `019f14f9-8e3b-7232-9d59-6ee2c428279f`, 14 generated files, five passed guardrail checks, and sandbox deployment `DEP-REQ-2026-001-001`.

7. Show UiPath orchestration evidence
   Open the evidence panel or component map. Show the live solution-deployed Maestro process/release, API Workflows as validated handoffs with a local-runner build handoff and trusted bridge token support, Action Center as the human gate contract, Data Service as proposed audit state, and Test Manager as the live quality catalog. Do not say a Maestro run, Action Center task, Data Service record, or Test Cloud execution happened live unless the evidence panel contains real platform ids.

8. Open sandbox preview
   Open the Customer360 dashboard from the output/deployment section. Verify synthetic metrics render, direct identifiers are masked, and sandbox labeling is visible.

9. Show evidence and close
   Show the audit timeline, build/deploy evidence, quality checks, and final truth table. End with the exact approval gates still required for a live Automation Cloud run.

## Architecture Talk Track

- "Agent Factory turns a business request into a governed build workflow, not an unconstrained prompt box."
- "UiPath is the enterprise control plane: Maestro BPMN for the process, API Workflows for handoffs, Action Center for human decisions, Data Service for proposed durable state, and Test Manager for quality evidence."
- "Fireworks-powered server-side agents clarify, plan, and govern when configured; deterministic fallback is labeled."
- "Codex is the constrained builder. It receives a manifest with allowed files, forbidden actions, sandbox-only deployment, test expectations, and repair limits."
- "The product hides most technical detail until the evidence drawer, where live/local/import-ready/proposal-only labels stay explicit."
- "The current live UiPath evidence is a solution-deployed Maestro process/release plus live Test Manager catalog; a complete live run still needs a real Maestro instance ID and human task ID."

## No-Secret Validation

Before recording or handoff:

```bash
npm run demo:scan
git diff --check
```

Manual checks:

- Terminal output and screenshots must not show provider values, browser storage, local configuration contents, trace payloads, credentials, raw customer identifiers, or API keys.
- LangSmith traces may be linked only after sanitized payload review.
- UiPath CLI output may show organization, tenant, folder, project, test case, BPMN validation, and future execution ids, but not secrets or tenant-private payloads beyond approved evidence.
- Build Worker logs should show redacted events, allowed-file results, and status evidence only.

## Approval-Gated Actions

Do not perform these without explicit approval for the exact command and target:

- Maestro publish, deploy, or run.
- API Workflow upload or runtime calls.
- Action Center task creation, completion, cancellation, or assignment.
- Data Service choice-set, entity, schema, or record creation.
- Agent upload, publish, deploy, or run.
- UiPath Apps pack, publish, or deploy.
- Live Test Manager/Test Cloud execution.
- Future live Codex execution that uses paid/account-bound resources beyond the bounded 2026-06-29 activation.
- Public hosting with secrets or any production release.

## Handoff Checklist

- `docs/live-demo-runbook.md` reflects Checkpoint 7 and the current UI/API/worker truth.
- `docs/component-map.md` separates live, local, import-ready, proposal-only, and approval-gated states.
- `docs/orchestration/checkpoint-7/status.md` lists final QA checks, residual risks, and approvals required.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run smoke`, `npm run smoke:demo`, and `git diff --check` pass.
- Any claim that uses "live" names the concrete live asset or states the approval boundary.
