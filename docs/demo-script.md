# Five-Minute Demo Script

This script is written for the Checkpoint 7 AgentHack Track 2 state. It shows a working local product loop, live read-only UiPath evidence, validated/import-ready Maestro and API Workflow assets, and explicit approval boundaries for live platform mutations.

## Canonical Request

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

## Preflight

```bash
npm install
npm run smoke:demo
npm run dev:live
```

Open the URLs printed by `npm run dev:live`. The defaults are:

- Factory Console: `http://localhost:5183`
- Customer360 sandbox preview: `http://localhost:5184`
- Factory API: `http://localhost:8887`
- Build Worker: `http://localhost:8890`

If those ports are busy, use inline overrides before `npm run dev:live`; they take precedence over `.env.local`.

Keep [docs/live-demo-runbook.md](live-demo-runbook.md) open for the exact truth table and approval boundaries.

## Timed Talk Track

| Time | What to show | Narration |
|---|---|---|
| 0:00-0:25 | Factory Console opening state | Coding agents are fast, but enterprises need ownership, approvals, tests, deployment controls, and audit before generated apps reach users. Agent Factory makes UiPath the governed control plane for coding agents that build internal apps. |
| 0:25-0:55 | Submit or show the Customer360 request | A business user asks for customer analytics. The request does not go straight to a freeform coding prompt; it enters a governed request-to-release lifecycle. |
| 0:55-1:25 | Generated clarification questions | The Requirements and Clarification agent path asks only for missing facts needed to build safely: approved sources, metrics, filters, PII policy, refresh expectations, and approval ownership. Provider-backed mode uses configured Fireworks profiles; deterministic fallback is labeled when no provider call is available. |
| 1:25-1:55 | Build plan and governance | The plan turns intent into an approved Customer360 manifest: template, metrics, source scope, masked PII, allowed files, forbidden actions, sandbox-only deployment, and required human approval. |
| 1:55-2:20 | Scope approval | Show the Action Center-shaped scope/data approval. In the live Automation Cloud path this is the Action Center gate; no live task is claimed unless a real task id exists. |
| 2:20-2:55 | Build Worker and Codex evidence | Codex is the constrained builder. The worker receives a bounded manifest and either reports redacted diff/test evidence when live Codex is explicitly enabled, or blocks honestly in default mode until the exact approval is given. The approved activation run produced live Codex session `019f14f9-8e3b-7232-9d59-6ee2c428279f`, 14 generated files, and passed guardrail checks. |
| 2:55-3:25 | UiPath orchestration evidence | Show Maestro BPMN as the Track 2 process spine, API Workflow handoff assets, live Test Manager catalog/test cases, Data Service audit model, Action Center approval gates, and the UiPath Apps companion surface. Keep the visual emphasis on how UiPath owns the request-to-release lifecycle. |
| 3:25-3:55 | Quality gates | Show `smoke:demo`, local tests, and the live `AFQG` Test Manager catalog. Say Test Cloud execution remains approval-gated and was not run without explicit approval. |
| 3:55-4:30 | Customer360 dashboard | Open the sandbox preview. Show revenue, repeat purchase, return rate, retention proxy, behavior funnel, category mix, churn risk, masked customer identifiers, dataset modes, and refresh behavior. |
| 4:30-5:00 | Audit and close | Show the audit/evidence surface. Close with the thesis: the user sees a simple request flow; UiPath governs the process; agents clarify and plan; Codex builds inside bounds; tests and audit carry the evidence. |

## UiPath Proof Points

Show these in the UI, terminal, or docs:

- Maestro BPMN source validates, models the whole lifecycle, and is solution-deployed live as patched version `1.0.1` in isolated folder `AgentFactoryDemoLiveSpine 1`; no runtime process instance is claimed yet.
- Agent Builder projects validate locally for Requirements, Clarification, Governance, Build Planner, and Test Summary.
- Action Center contracts define scope and release approval payloads.
- Data Service schema defines the future state/audit system of record.
- API Workflows validate for StartBuildWorker, FetchBuildStatus, PostStatusUpdate, RecordTestResult, StartDeployment, and RecordUiPathEvent; all support the optional trusted bridge token header, and `AgentFactory_StartBuildWorker` also succeeded through the local UiPath API Workflow runner.
- Test Manager project/test set/test cases are live.
- UiPath for Coding Agents setup is available through `uip skills install --agent codex --local`, and the 2026-06-29 activation captured a live Codex readiness/build session.
- Fireworks and LangSmith are server-side provider integrations; keys stay in local/deployment configuration and are never shown in UI, docs, logs, screenshots, or git.

## Current Boundaries To Say Out Loud

- Test Manager catalog is live; executions still require approval.
- Data Service schema is proposal-only until entity creation is approved.
- Maestro BPMN is solution-deployed live, but a completed Maestro run still requires live task bindings and a successful process instance id.
- Agents and API Workflows are validated/import-ready until upload/run is approved.
- Action Center and UiPath Apps contracts are proposal-only until creation/deployment is approved.
- Production deployment is not part of this demo.
- The `AgentFactory_StartDeployment` workflow targets the implemented local `POST /deploy` sandbox endpoint for deployment evidence.

## Reset And Rehearsal

- Run `npm run smoke:demo` before recording.
- Restart `npm run dev:live` if local lifecycle state is stale.
- Use the canonical request above for the primary take.
- Crop terminal output and provider/Uipath portal views so secrets, trace payloads, and tenant-private data are not visible.
- If a live approval-gated command has not been executed, say so plainly and show the corresponding import-ready or proposal-only evidence instead.
