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
| 0:00-0:25 | Factory Console new request | Coding agents are fast, but enterprises need ownership, approvals, tests, deployment controls, and audit. Agent Factory makes UiPath the governed control plane for coding agents that build internal apps. |
| 0:25-0:55 | Submit the Customer360 request | A business user asks for customer analytics. The request does not go straight to a freeform coding prompt; it enters a governed request-to-release lifecycle. |
| 0:55-1:25 | Generated clarification questions | The agent path asks only for missing facts needed to build safely: approved sources, metrics, filters, PII policy, refresh expectations, and approval ownership. Provider-backed mode uses configured Fireworks profiles; deterministic fallback is labeled when no provider call is available. |
| 1:25-1:55 | Build plan and governance | The plan turns intent into an approved Customer360 manifest: template, metrics, source scope, masked PII, allowed files, forbidden actions, sandbox-only deployment, and required human approval. |
| 1:55-2:20 | Scope approval | Show the local approval control. Explain that in the live Automation Cloud path this is the Action Center gate; no live task is claimed unless a real task id exists. |
| 2:20-2:55 | Build Worker and Codex evidence | Codex is the constrained builder. The worker receives a bounded manifest and either reports redacted diff/test evidence when live Codex is explicitly enabled, or blocks honestly in default mode until the exact approval is given. |
| 2:55-3:25 | UiPath orchestration evidence | Show Maestro BPMN as the Track 2 process spine, API Workflow handoff assets, live Test Manager catalog/test cases, and the proposal-only Data Service, Action Center, and Apps contracts. Use the live/local/import-ready/proposal labels exactly. |
| 3:25-3:55 | Quality gates | Show `smoke:demo`, local tests, and the live `AFQG` Test Manager catalog. Say Test Cloud execution remains approval-gated and was not run without explicit approval. |
| 3:55-4:30 | Customer360 dashboard | Open the sandbox preview. Show revenue, repeat purchase, return rate, retention proxy, behaviour funnel, category mix, churn risk, masked customer identifiers, dataset modes, and refresh behavior. |
| 4:30-5:00 | Audit and close | Show the audit/evidence surface. Close with the thesis: the user sees a simple request flow; UiPath governs the process; agents clarify and plan; Codex builds inside bounds; tests and audit carry the evidence. |

## UiPath Proof Points

- Live read-only evidence: logged-in UiPath tenant context, Orchestrator folder `AgentFactoryDemo`, Test Manager project `AFQG`, and seven cataloged test cases.
- Validated/import-ready: Maestro BPMN at `uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn`, five API Workflow assets, and five low-code Agent projects.
- Proposal-only until approved: Data Service schema, Action Center contracts, and UiPath Apps companion contract.
- Approval-gated: Maestro publish/run, API Workflow upload/run, Action Center task creation/completion, Data Service writes, Agent upload/deploy/run, Test Cloud execution, live Codex execution, public hosting with secrets, and production release.

## Current Boundaries To Say Out Loud

- This is a working local product loop with live read-only UiPath proof, not a production deployment.
- Codex live execution is implemented as an opt-in path; default mode blocks until `BUILD_WORKER_CODEX_ENABLED=true` and the exact workspace/action approval are provided.
- Fireworks and LangSmith are server-side provider integrations; keys stay in local/deployment configuration and are never shown in the UI, docs, logs, screenshots, or git.
- The Customer360 dashboard uses synthetic data and masked identifiers.
- Use the URLs printed by `npm run dev:live`; ports can change if local conflicts exist.

## Reset And Rehearsal

- Run `npm run smoke:demo` before recording.
- Restart `npm run dev:live` if local lifecycle state is stale.
- Use the canonical request above for the primary take.
- Crop terminal output and provider/Uipath portal views so secrets, trace payloads, and tenant-private data are not visible.
- If a live approval-gated command has not been executed, say so plainly and show the corresponding import-ready or proposal-only evidence instead.
