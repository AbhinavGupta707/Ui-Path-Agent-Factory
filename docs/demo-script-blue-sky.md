# Three-Minute Blue Sky Demo Script

This script is tailored for UiPath AgentHack 2026, Track 2: UiPath Maestro BPMN. It is written for a roughly three-minute Devpost video or finalist-style walkthrough, while keeping the current implementation boundaries honest.

Official challenge facts checked on 2026-06-29:

- Submission deadline: June 29, 2026 at 11:45pm EDT.
- Demo video limit: five minutes maximum. This draft targets three minutes.
- Required story: working solution on UiPath Automation Cloud, with UiPath as the orchestration and governance layer.
- Track target: model and run an end-to-end process with BPMN 2.0 in UiPath Maestro.
- Phase 1 criteria: Business Impact and Adoption Potential, Platform Usage, Technical Execution, Completeness of Delivery, Creativity and Innovation. Equal weight.
- Coding agent bonus: up to 2 points when the submission clearly documents which coding agent was used, how it contributed, and includes verifiable evidence.

## Setup Tabs

1. Factory Console: `http://localhost:5183`
2. Customer360 dashboard: `http://localhost:5184`
3. Evidence drawer in Factory Console, ready to open from the `Evidence` button.
4. Optional supporting tab or screenshot: UiPath Test Manager catalog `Agent Factory Quality Gates` / `Customer360 Release Gate`.
5. Optional supporting tab or screenshot: validated Maestro BPMN project or component map.

Start the local stack with:

```bash
npm run smoke
npm run dev:live
```

Canonical request:

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

## Main Script

| Time | What to show | What to say |
|---|---|---|
| 0:00-0:20 | Factory Console, `New Request` | Hello everyone, my name is Abhinav, and this is Governed Agentic Automation Factory: UiPath as the enterprise control plane for coding agents that build internal business apps. Coding agents make it easy to create software, but enterprises still need ownership, approvals, tests, audit, and safe deployment. That is the gap Agent Factory is built for. |
| 0:20-0:45 | Paste the Customer360 request and click `Submit request` | Let's see how it works. A business user asks for a Customer360 dashboard across purchases, behaviour, segments, and historical activity. The important design choice is that the request does not go straight to Codex. It enters a governed UiPath-shaped lifecycle first. |
| 0:45-1:10 | Show generated clarification questions | The agent path asks only for the missing facts needed to build safely: approved data sources, metrics, filters, PII policy, and who owns approval. This is the business impact: turning shadow IT into a repeatable request-to-release process that a real enterprise could adopt. |
| 1:10-1:40 | Open `Build Plan`; show governance, metrics, approvals, manifest | Here is the judged platform story on one screen. Maestro BPMN is the process spine. UiPath Agents shape requirements, governance, build planning, and test summaries. Action Center gates scope and release. API Workflows hand off to the build worker. Data Service is the audit model. Test Manager and Test Cloud provide quality evidence. This is deliberate platform usage, not a logo checklist. |
| 1:40-2:15 | Click `Approve plan`, then `Open live run`; show progress rail and evidence | Behind that approval, the system creates a build manifest. Codex receives a constrained manifest, not a vague prompt: allowed files, approved metrics, sandbox-only deployment, no secret access, masked PII, and a bounded repair limit. If the live runner is enabled, Codex works inside that contract and returns diff, branch, test, and artifact evidence. If it is unavailable, the worker blocks honestly instead of pretending the build passed. That is technical execution: handoffs, failure states, and guardrails are product behavior. |
| 2:15-2:40 | Click `Approve release`, then `Open preview`; show Customer360 dashboard | The output is not just a generated screenshot. It is a working Customer360 dashboard with synthetic data, masked identifiers, governed KPIs, refresh states, degraded and empty states, and metric tests. The dashboard is the proof artifact; the actual product is the governed factory around it. |
| 2:40-3:00 | Open evidence drawer; show manifest, audit, Test Manager/catalog or BPMN evidence | To make the scoring explicit: business impact is governed app delivery, platform usage is UiPath orchestration across agents, humans, APIs, tests, and audit, technical execution is manifest-first Codex with guardrails, completeness is the end-to-end request-to-preview flow, and creativity is the product move: UiPath becomes the operating system for coding agents. The AI plans and builds. UiPath orchestrates and governs. Tests and audit carry the evidence. |

Approximate spoken length: 455 words.

## Shorter Emergency Version

Hello everyone, my name is Abhinav, and this is Governed Agentic Automation Factory: UiPath as the enterprise control plane for coding agents.

The problem is not that teams cannot generate internal tools anymore. The problem is that enterprises cannot safely adopt tools that skip ownership, approved data scope, tests, deployment gates, and audit.

In this demo, a business user asks for a Customer360 analytics dashboard. Agent Factory does not send that straight to Codex. It starts a governed UiPath lifecycle: clarification, requirements, governance, scope approval, manifest creation, build handoff, tests, release approval, sandbox preview, and audit.

On the build plan, the judging criteria are visible. Maestro BPMN owns the process. UiPath Agents produce requirements, governance, build plans, and test summaries. Action Center gates human decisions. API Workflows call the build worker. Data Service is the audit model. Test Manager and Test Cloud provide quality evidence.

Codex is used as the constrained builder. It receives a manifest with approved files, metrics, PII policy, sandbox-only deployment, forbidden actions, and repair limits. That is the coding-agent bonus story: Codex is meaningfully integrated into the working solution, not merely referenced.

The final output is a real Customer360 dashboard with synthetic data, masked identifiers, KPIs, refresh behavior, and tests. The dashboard is the artifact. The product is the governed factory that lets enterprises use coding agents without losing control.

The AI plans and builds. UiPath orchestrates and governs. Tests and audit carry the evidence.

## Blue Sky Lines To Use In Feedback

- "Blue Sky version: every department can request internal apps, but no generated app bypasses UiPath governance."
- "The user sees a simple request flow; the enterprise sees approvals, evidence, quality gates, and audit."
- "This is not an AI app builder. It is a governed assembly line for coding agents."
- "A failed or blocked build is still useful because the factory preserves exactly where governance stopped it."
- "The dashboard proves one template; the architecture scales to request-to-release automation."

## Live Fallback Lines

Use one of these only if needed.

- If provider mode is deterministic: "This recording is running in deterministic rehearsal mode, but it uses the same lifecycle contracts and labels provider status honestly."
- If Codex is disabled: "The build worker is intentionally blocked until live Codex execution is enabled. The product behavior is that blocked is a governed state with evidence, not a hidden failure."
- If Maestro is not live in the recording: "The BPMN project is validated and import-ready here. In the live Automation Cloud path, replace this line with the Maestro run id and show it in the evidence drawer."
- If Test Cloud was not executed: "The Test Manager catalog is live; execution remains approval-gated, so the local smoke and metric tests are the release evidence shown in this recording."
- If a screen is slow: "While this is loading, the important thing is the separation of responsibility: agents explain and plan, Codex edits, UiPath controls the process, and tests verify the output."

## Judge Extraction Checklist

- Business impact: say "shadow IT into request-to-release governance" before the first minute.
- Platform usage: name Maestro BPMN, UiPath Agents, Action Center, API Workflows, Data Service, Test Manager/Test Cloud, and UiPath for Coding Agents in the Build Plan segment.
- Technical execution: show manifest-first Codex, allowed files, sandbox-only deployment, PII masking, repair limits, tests, and blocked states.
- Completeness: show request, clarification, approval, run, release, preview, and evidence.
- Creativity: state that UiPath is the operating system/control plane for coding agents, not just an automation add-on.
- Bonus: explicitly document and show Codex as the constrained builder, with evidence such as prompt/session export, README section, screenshots, or worker logs.
