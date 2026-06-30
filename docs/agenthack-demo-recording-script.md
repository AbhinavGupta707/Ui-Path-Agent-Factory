# AgentHack Demo Recording Script

Use this as the recording run-of-show for the UiPath AgentHack demo video.

The recording should feel like:

1. Quantify the problem.
2. Name the gap Agent Factory fills.
3. Show the end-to-end product flow.
4. Close on architecture, evidence, and judging fit.

## Source Notes

- Devpost listing: https://uipath-agenthack.devpost.com/
- Track fit: Track 2, UiPath Maestro BPMN.
- Devpost requires a working agentic solution on UiPath Automation Cloud, a demo video no longer than five minutes, architecture walkthrough, agents/orchestration explanation, where humans fit in, a public GitHub repo, and a presentation deck.
- Judging criteria to emphasize: Business Impact and Adoption Potential, Platform Usage, Technical Execution, Completeness of Delivery, Creativity and Innovation, Presentation, plus Coding Agents bonus points inside Platform Usage.
- Problem statistic source: https://survey.stackoverflow.co/2025/ai

## Recording Stance

This script intentionally positions Agent Factory as a UiPath-governed product, not a chat wrapper and not a dashboard generator. The dashboard is the artifact. The actual submission is the enterprise process that turns a business request into an approved, tested, auditable internal app.

Safe phrasing for Codex:

```text
The worker path is manifest-first. When live Codex execution is enabled, Codex works inside this contract and returns session, diff, file, test, and artifact evidence.
```

Avoid saying:

```text
Codex just built this dashboard live in seconds.
```

## Image Generation Prompts

### Slide 1: Title / Control Plane

```text
Create a complete 16:9 premium dark enterprise software title slide for a hackathon demo. The slide should look like a polished SaaS product keynote, not a generic AI poster. Background: an abstract enterprise automation control plane with a central orchestration hub connected to code editor panels, BPMN workflow rails, approval gates, audit logs, quality checks, API handoff nodes, and sandbox deployment tiles. Use restrained dark graphite and navy background, crisp white text, cyan-green status accents, and a small amount of violet highlighting. No real company logos. No people. Make the text sharp and readable.

Exact slide text:
Title, large on the left: Governed Agentic Automation Factory
Subtitle beneath it: UiPath as the enterprise control plane for coding agents
Small footer line: From business request to governed internal app

Composition: title block on the left third with generous negative space; visual control-plane network on the right two-thirds; professional enterprise hackathon presentation style; high contrast; clean spacing; no clutter; no extra text.
```

### Slide 2: Problem / Why This Matters

```text
Create a complete 16:9 premium dark SaaS problem slide. The slide should visualize the risk of ungoverned AI-generated internal apps. Background: many glowing app prototypes and code panels branching from a single prompt, with subtle warning markers for missing ownership, unapproved data access, weak testing, missing audit trail, and unsafe deployment. The mood should be urgent but credible, like an enterprise boardroom technology slide. Use dark charcoal and slate, white text, cyan-green highlights, and amber warning accents. No logos. No people. Make all text crisp and readable.

Exact slide text:
Headline, large: AI can build faster.
Second line, large: Enterprises still need trust.

Stat block, right side:
84% use or plan to use AI tools
46% distrust AI output accuracy

Small source line:
Source: Stack Overflow Developer Survey 2025

Bottom thesis line:
The gap is not generation. The gap is governed delivery.

Composition: problem visuals on the left half, stats and thesis on the right half, clean alignment, no extra text, high contrast, professional hackathon demo style.
```

## Demo Setup

Open the product:

```text
http://localhost:5183
```

Keep the Customer360 preview available if needed:

```text
http://localhost:5184
```

Before recording:

- Hard refresh `http://localhost:5183`.
- Start on `New Request`.
- Do not double-click model-backed steps.
- Expect `Generate build plan` to take 60-90 seconds.
- Expect `Approve plan` to take 30-60 seconds.

## Exact Demo Request

Paste this into `Business outcome`:

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

## Judging Map

- Business impact: enterprises can adopt coding agents without losing ownership, approvals, tests, audit, and release control.
- Platform usage: Maestro BPMN is the process spine; UiPath agents shape requirements and summaries; Action Center handles human gates; API Workflows hand off the manifest; Data Service is the audit model; Test Manager/Test Cloud evidence supports quality; coding agents sit inside UiPath governance.
- Technical execution: manifest-first worker contract, sandbox-only deployment, PII masking, allowed-file scope, forbidden actions, bounded repair loop, progress states, blocked-state honesty, and evidence capture.
- Completeness: request to clarification to plan to approval to run to release to preview to evidence.
- Creativity: UiPath becomes the operating system for coding agents, not just an automation tool beside them.
- Presentation: short problem setup, product onscreen quickly, architecture explained during wait time, evidence at the end.

## Broad Navigation

- Start with Slide 1, then Slide 2.
- Switch to Factory Console on `New Request`.
- Submit the Customer360 request.
- Show generated clarification questions.
- Generate the build plan.
- Show the Build Plan screen and governance/manifest details.
- Approve the plan and show the Live Run.
- Approve release.
- Open the Customer360 preview inside the console first.
- Use `http://localhost:5184` only if you want a full-screen dashboard shot after the in-app preview opens.
- Finish on the Evidence drawer or run evidence rail.

## Recording Script

### 0:00-0:20 - Title Slide

Screen cue: show Slide 1.

```text
Hello everyone, my name is Abhinav, and this is Governed Agentic Automation Factory: UiPath as the enterprise control plane for coding agents that build internal business apps.
```

### 0:20-0:50 - Problem Slide

Screen cue: show Slide 2.

```text
AI has made it easier than ever to ship software, but not easier to trust it. Stack Overflow's 2025 survey found that 84% of developers use or plan to use AI tools, while 46% distrust AI output accuracy.

That is exactly the enterprise problem. A business user can ask for an internal app, and a coding agent can produce one, but the enterprise still needs ownership, approved data access, human decisions, tests, audit, and safe release. That is the gap Agent Factory is built for.
```

### 0:50-1:10 - New Request

Screen cue: switch to Factory Console, submit the Customer360 request.

```text
Let's see how it works. A revenue operations user asks for a Customer360 dashboard across purchases, behavior, segments, and historical activity.

The important design choice is that the request does not go straight to a coding agent. It enters a UiPath-governed lifecycle first.
```

### 1:10-1:35 - Clarification

Screen cue: show the generated questions and answered state.

```text
The first agent step converts a vague business ask into the facts needed to build safely: source systems, metric definitions, filters, PII policy, refresh needs, and approval ownership.

This is where the product starts turning shadow IT into a repeatable enterprise process. Before code is touched, the request becomes structured work.
```

### 1:35-2:10 - Build Plan Generation

Screen cue: generate the plan; use the wait to explain architecture.

```text
While the build plan generates, this is the architecture the judges should care about.

Agent Factory is aligned to the Maestro BPMN track because it models a predictable request-to-release business process. Maestro is the process spine. UiPath agents shape requirements, governance, planning, and test summaries. Action Center is the human approval pattern. API Workflows hand the approved manifest to the worker. Data Service carries the audit model. Test Manager and Test Cloud evidence support release quality.

The product move is that UiPath is not a logo in the corner. UiPath defines the lifecycle the coding agent has to obey.
```

### 2:10-2:45 - Build Plan

Screen cue: show Build Plan, governance, approvals, and manifest details.

```text
Here is the key artifact: the build manifest.

A coding agent should not receive a vague prompt like "make me a dashboard." It should receive approved metrics, allowed files, forbidden actions, sandbox-only deployment, PII rules, expected tests, and a bounded repair limit.

That is the technical heart of Agent Factory: the AI can plan and build, but the enterprise process defines the contract.
```

### 2:45-3:20 - Plan Approval And Live Run

Screen cue: approve the plan, then show the Live Run progress rail.

```text
This approval is not cosmetic. It is a state transition: scope and policy are approved before any worker path can proceed.

The run then moves through clarification, governance, human gate, API handoff, build, quality, release, and preview. The worker path is manifest-first. When live Codex execution is enabled, Codex works inside this contract and returns session, diff, file, test, and artifact evidence. If execution is unavailable, the run blocks honestly instead of pretending the build passed.
```

### 3:20-3:45 - Release Approval

Screen cue: approve release and show the release-ready state.

```text
Release approval is separate from scope approval. The app is not releasable just because AI generated or assembled it.

It needs evidence: test status, guardrails, deployment target, rollback notes, and an accountable human decision.
```

### 3:45-4:15 - Output Preview

Screen cue: open the Customer360 preview from the console. If the embedded preview feels too small for the recording, then open the full-screen preview at `http://localhost:5184`.

```text
The output is a working Customer360 dashboard, not a static screenshot. It uses synthetic data, masked identifiers, governed KPIs, segment filters, refresh states, degraded and empty states, and metric tests.

The dashboard is the proof artifact. The actual product is the governed factory around it.
```

### 4:15-4:45 - Evidence Close

Screen cue: finish on the Evidence drawer or live run evidence rail.

```text
To close, this evidence view is the important part. The dashboard proves we can produce an internal app; the evidence proves the enterprise can own it.

The manifest captures the approved scope and policy. The audit trail records the lifecycle. The platform evidence ties the work back to UiPath orchestration, human approvals, API handoffs, tests, and release control. And the worker contract shows that the coding agent is not acting freely; it is building inside a governed boundary.

So Agent Factory is not trying to replace enterprise governance with AI. It gives coding agents an operating model enterprises can trust.

The AI plans and builds. UiPath orchestrates, governs, and records the evidence. That is Agent Factory: a controlled path from business request to reviewed internal app.
```

## Shorter Emergency Close

Use this if the recording is running long:

```text
The key idea is simple: coding agents should not bypass enterprise process. Agent Factory gives them a governed UiPath lifecycle: BPMN orchestration, human gates, API handoffs, audit state, tests, and release evidence. The AI builds inside the contract. UiPath carries the control plane.
```

## Rehearsal Notes

- Best opening product frame: Factory Console on `New Request`.
- Best wait-time narration: architecture and judging map.
- Best final frame: Evidence drawer open with platform evidence visible.
- If generation is slow, stay calm and continue architecture narration.
- If a lifecycle warning appears, hard refresh `http://localhost:5183` and restart the flow.
- Do not describe the Customer360 dashboard as freshly generated by Codex unless the live Codex worker is actually enabled and fresh evidence exists.
