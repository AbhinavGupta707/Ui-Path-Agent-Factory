# AgentHack Demo Recording Script

Use this as the recording run-of-show for the UiPath AgentHack demo video.

The structure is:

1. Title slide.
2. Problem/context slide.
3. Product demo in Factory Console.
4. Evidence close.

## Image Generation Prompts

### Slide 1: Title / Control Plane

```text
16:9 premium dark enterprise software slide background for a hackathon demo. Show an abstract AI automation control plane: a central command hub orchestrating code windows, workflow rails, approval gates, audit trails, quality checks, and sandbox deployment nodes. Modern SaaS aesthetic, polished glass panels, subtle cyan green and violet accents, high contrast, cinematic but clean, no logos, no readable text, no people, leave negative space on the left for the title "Governed Agentic Automation Factory".
```

Suggested slide text:

```text
Governed Agentic Automation Factory
UiPath as the enterprise control plane for coding agents
```

### Slide 2: Problem / Why This Matters

```text
16:9 premium dark SaaS presentation slide background showing the risk of ungoverned AI-generated internal apps. Many glowing app prototypes and code panels branch out from a single prompt, with abstract warning markers for missing approvals, untested logic, unclear data access, and missing audit evidence. Sophisticated enterprise design, no logos, no readable text, no people, leave clean negative space on the right for statistics and short copy.
```

Suggested slide text:

```text
AI can build faster.
Enterprises still need trust.

84% use or plan to use AI tools.
46% distrust AI output accuracy.

Source: Stack Overflow Developer Survey 2025
```

## Demo Setup

Open:

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
- Do not double-click during model-backed steps.
- After `Generate build plan`, wait patiently. This can take 60-90 seconds.
- After `Approve plan`, wait patiently. This can take 30-60 seconds.

## Exact Request

Paste this into `Business outcome`:

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

## Recording Script

### 0:00-0:20 - Slide 1: Title

Navigation:

- Show title slide.

Narration:

```text
Hello everyone, my name is Abhinav, and this is Governed Agentic Automation Factory: UiPath as the enterprise control plane for coding agents that build internal business apps.
```

### 0:20-0:50 - Slide 2: Problem

Navigation:

- Move to problem slide.

Narration:

```text
Coding agents have made it easier than ever to create software. Stack Overflow's 2025 survey found that 84% of developers use or plan to use AI tools, but 46% distrust AI output accuracy.

So the issue is not whether AI can build. The issue is whether enterprises can govern what AI builds: ownership, approved data access, human decisions, quality gates, audit, and controlled deployment. That is the gap Agent Factory is built for.
```

### 0:50-1:10 - Factory Console: New Request

Navigation:

- Switch to Chrome.
- Open `http://localhost:5183`.
- Confirm the left navigation is on `New Request`.
- Paste the exact Customer360 request into `Business outcome`.
- Click `Submit request`.

Narration:

```text
Let's see how it works. A business user asks for a Customer360 dashboard across purchases, behavior, segments, and historical activity. The request does not go straight to a coding agent. It enters a governed lifecycle first.
```

### 1:10-1:40 - Clarification Questions

Navigation:

- Wait for generated questions.
- Show the `Clarifying questions` section.
- Make sure the view shows `7/7 answered`.
- Let the viewer see `UiPath Clarification Agent (Fireworks Live)` labels.

Narration:

```text
The system asks only for the missing facts needed to build safely: approved source details, metric definitions, filters, PII policy, refresh cadence, and approval ownership. This turns a vague business ask into structured enterprise work.
```

### 1:40-1:55 - Generate Build Plan

Navigation:

- Click `Generate build plan`.
- Wait. Do not double-click.

Narration:

```text
Now Agent Factory turns those answers into a governed build plan. This step is model-backed, so I will use the wait to explain the architecture.
```

### 1:55-2:35 - Architecture During Wait

Navigation:

- Stay on the current screen while the plan generates.
- If the screen changes to `Build Plan` early, keep talking while showing the generated plan.

Narration:

```text
Maestro is the process spine from intake to release. UiPath agents shape requirements, governance, planning, and test summaries. Action Center is the approval pattern. API Workflows hand the approved manifest to the worker. Data Service carries the audit model. Test Manager provides release quality evidence.

The product move is that UiPath is not a side integration. UiPath defines the lifecycle the coding agent has to obey.
```

### 2:35-3:05 - Build Plan

Navigation:

- Show `Build Plan`.
- Point attention to plan, governance, approval, and manifest details.

Narration:

```text
Here is the key artifact: the build manifest. A coding agent should not receive a vague prompt. It should receive approved metrics, allowed files, forbidden actions, sandbox-only deployment, masked PII policy, test expectations, and a bounded repair limit.

That is the technical heart of Agent Factory: AI can build, but the enterprise process defines the contract.
```

### 3:05-3:20 - Approve Plan

Navigation:

- Click `Approve plan`.
- Wait for the `Live Run` view.

Narration:

```text
This is the first human gate. Scope and data policy must be approved before the worker path can proceed.
```

### 3:20-3:55 - Live Run

Navigation:

- Show the progress rail.
- Show live activity.
- Let the viewer see the run status and evidence rows.

Narration:

```text
The run moves through clarification, governance, human gate, API handoff, build, quality, release, and preview.

The worker path is manifest-first. When live Codex execution is enabled, Codex works inside this contract and returns session, diff, file, test, and artifact evidence. If execution is unavailable, the run blocks honestly instead of pretending the build passed.
```

### 3:55-4:10 - Approve Release

Navigation:

- Click `Approve release`.
- Wait until `Open preview` appears.

Narration:

```text
Release approval is separate from scope approval. The app is not releasable just because AI generated or assembled it. It needs evidence: tests, guardrails, deployment target, rollback notes, and approval.
```

### 4:10-4:35 - Output Preview

Navigation:

- Click `Open preview`.
- Show the Customer360 preview inside the Factory Console.
- Optionally click `Open sandbox preview` to show `http://localhost:5184`.

Narration:

```text
The output is a working Customer360 dashboard, not a static screenshot. It uses synthetic data, masked identifiers, governed KPIs, segment filters, refresh states, degraded and empty states, and metric tests.

The dashboard is the proof artifact. The actual product is the governed factory around it.
```

### 4:35-5:00 - Evidence Close

Navigation:

- Return to Factory Console if you opened the external preview.
- Click `Evidence`.
- End on the evidence drawer or the live run evidence rail.

Narration:

```text
The evidence drawer makes the submission scorable: manifest, audit timeline, platform evidence, API state, quality evidence, and the worker contract.

Business impact is governed internal app delivery. Platform usage is UiPath orchestration across agents, approvals, APIs, tests, and audit. Technical execution is manifest-first coding-agent control. Completeness is the end-to-end request-to-preview flow. Creativity is the product move: UiPath becomes the operating system for coding agents.

The AI plans and builds. UiPath orchestrates and governs. Tests and audit carry the evidence. That is Agent Factory: a controlled path from business request to reviewed internal app.
```

## Recording Notes

- Best final frame: `Evidence` drawer open with platform evidence visible.
- If `Generate build plan` appears slow, continue the architecture narration.
- If a lifecycle warning appears, hard refresh `http://localhost:5183` and restart the flow.
- Do not say the dashboard was created from scratch in seconds.
- Safe wording: "The worker path is manifest-first" and "when live Codex execution is enabled."
- Avoid saying: "Codex just built this dashboard live" unless the Build Worker is actually running with live Codex enabled and you have fresh build evidence.

