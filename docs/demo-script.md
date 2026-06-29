# Five-Minute Demo Script

This script is written for the current Checkpoint 5 state. It shows the governed factory running locally, the live Test Manager catalog, and the UiPath assets that are import-ready or proposal-only until explicit approval.

## Canonical Request

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

## Preflight

```bash
npm install
npm run smoke
```

Then start each long-running service in a separate terminal:

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

Open the Factory Console and Customer360 dashboard from the Vite URLs printed by the dev servers. Confirm:

- `http://localhost:8787/health` returns `factory-api`.
- `http://localhost:8790/health` returns `build-worker`.
- The Factory Console labels unavailable runtime paths honestly.
- The Customer360 dashboard renders masked synthetic data.

## Timed Talk Track

| Time | What to show | Narration |
|---|---|---|
| 0:00-0:25 | Factory Console opening state | Coding agents are fast, but enterprises need governance, ownership, tests, approvals, and audit before generated apps reach users. This project makes UiPath the control plane for coding agents. |
| 0:25-0:55 | Submit or show the Customer360 request | The business user asks for customer analytics. The request enters a controlled intake flow instead of going straight to a freeform coding prompt. |
| 0:55-1:25 | Clarification questions | The Requirements and Clarification agent path asks focused questions: approved sources, metrics, filters, PII policy, and approval owner. |
| 1:25-1:50 | Governance panel | The Governance agent path classifies risk, detects Customer360/CRM-style PII, requires masking, forbids production deploy and secret access, and routes to approval. |
| 1:50-2:10 | Scope approval | Show the Action Center-shaped scope/data approval. In this repo it is local/proposal-backed unless a live Action Center task has been explicitly created. |
| 2:10-2:40 | Build manifest | Show the manifest: approved template, allowed files, sandbox-only flag, approved metrics, PII policy, and max one repair attempt. Codex receives this manifest, not vague instructions. |
| 2:40-3:15 | Build Worker evidence | Show the build worker contract and status. The service exposes `/build` and `/build/:id`; the default runtime blocks honestly, and the approved activation run produced live Codex session `019f14f9-8e3b-7232-9d59-6ee2c428279f`, 14 generated files, and passed guardrail checks. |
| 3:15-3:50 | Quality gates | Show local smoke/tests plus live Test Manager catalog `AFQG` / `Customer360 Release Gate`. Emphasize that live Test Cloud execution was not run without approval. |
| 3:50-4:15 | Release approval | Show the release approval contract: diff/branch or PR evidence, generated files, test results, PII scan, sandbox target, rollback notes. |
| 4:15-4:40 | Customer360 dashboard | Open the dashboard. Show revenue, repeat purchase, return rate, cohort/retention proxy, behavior funnel, category mix, churn risk, PII masking, and freshness. Use Refresh or dataset mode controls to prove output is not a static screenshot. |
| 4:40-5:00 | Audit and architecture close | Show the audit timeline and component map. Close with the thesis: UiPath orchestrates humans, agents, API workflows, tests, and coding agents through a governed build factory. |

## UiPath Proof Points

Show these in the UI, terminal, or docs:

- Maestro BPMN source validates, models the whole lifecycle, and is solution-deployed live as patched version `1.0.1` in isolated folder `AgentFactoryDemoLiveSpine 1`; no runtime process instance is claimed yet.
- Agent Builder projects validate locally for Requirements, Clarification, Governance, Build Planner, and Test Summary.
- Action Center contracts define scope and release approval payloads.
- Data Service schema defines the future state/audit system of record.
- API Workflows validate for StartBuildWorker, FetchBuildStatus, PostStatusUpdate, RecordTestResult, StartDeployment, and RecordUiPathEvent; all support the optional trusted bridge token header, and `AgentFactory_StartBuildWorker` also succeeded through the local UiPath API Workflow runner.
- Test Manager project/test set/test cases are live.
- UiPath for Coding Agents setup is available through `uip skills install --agent codex --local`, and the 2026-06-29 activation captured a live Codex readiness/build session.

## Current Boundaries To Say Out Loud

- Test Manager catalog is live; executions still require approval.
- Data Service schema is proposal-only until entity creation is approved.
- Maestro BPMN is solution-deployed live, but a completed Maestro run still requires live task bindings and a successful process instance id.
- Agents and API Workflows are validated/import-ready until upload/run is approved.
- Action Center and UiPath Apps contracts are proposal-only until creation/deployment is approved.
- Production deployment is not part of this demo.
- The `AgentFactory_StartDeployment` workflow targets the implemented local `POST /deploy` sandbox endpoint for deployment evidence.

## Reset And Rehearsal

- Restart `npm run dev:api` to clear in-memory lifecycle state.
- Refresh the Factory Console to return to seed/local state.
- Restart the Customer360 dev server if the browser has stale module state.
- Run `npm run smoke` before recording.
- Run the demo twice: once with the normal Customer360 request and once emphasizing the PII masking/governance path.
