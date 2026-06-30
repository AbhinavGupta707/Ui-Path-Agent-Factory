# UiPath AgentHack Requirements Analysis

Source reviewed: <https://uipath-agenthack.devpost.com/>

Review date: 2026-06-29

Organizer follow-up reviewed: 2026-06-30 email screenshot from the project
owner. The follow-up explicitly adds a qualification-sensitive Devpost field:
the UiPath Labs link/environment URL where the solution was built.

Required value for that Devpost field:

```text
https://staging.uipath.com/hackathon26_244/
```

The same follow-up asks the GitHub README to include Project Description,
UiPath Components, Agent Type, and Setup Instructions. The repository README now
contains those exact judge-facing sections.

## Executive Decision

Agent Factory should target Track 2, UiPath Maestro BPMN, for Checkpoint 7.

The product story is naturally an end-to-end business process: request intake, clarification, governance, human approval, manifest handoff, Codex build, quality checks, release approval, sandbox deployment, and audit. That maps directly to a Maestro BPMN flow that coordinates humans, agents, APIs, and automation services.

The earlier Checkpoint 7 framing of "one live UiPath proof" is too weak for the hackathon page. It may be useful as an intermediate activation check, but the checkpoint target should be a live Automation Cloud orchestration spine, not a side-channel proof.

## Requirements Read

The page positions UiPath as the execution and orchestration layer for agentic automation. It also emphasizes:

- working prototype over static mock,
- end-to-end flow,
- real-world business complexity,
- clear architecture and documentation,
- visibility into which agents are involved,
- human handoffs and governance,
- use of UiPath platform components,
- bonus credit for coding agents such as Codex through UiPath for Coding Agents.
- source repo, demo video, presentation deck, screenshots, and the
  organizer-required UiPath Labs environment URL.

The listed challenge tracks are:

- Track 1: UiPath Maestro Case
- Track 2: UiPath Maestro BPMN
- Track 3: UiPath Test Cloud

Agent Factory should focus on Track 2 and use Track 3 evidence where practical.

## Required Product Claim

The demo should be able to say:

"Agent Factory is a UiPath Maestro BPMN-orchestrated request-to-release workflow. Fireworks-backed agents clarify and plan the requested app, Action Center or a human gate governs approval, API Workflow hands the approved manifest to the Build Worker, Codex performs bounded repository work, Test Manager/Test Cloud records quality evidence where available, and the user reviews a sandbox dashboard preview. UiPath is the orchestration and governance layer, not a passive integration badge."

Only use this claim once a live Maestro or approved equivalent Automation Cloud execution has actually been recorded.

## Target End-To-End Flow

1. User submits a product request in Factory Console.
2. Factory API creates a request record and starts a graph run.
3. Fireworks-backed clarification agent generates questions based on missing information.
4. User answers the questions.
5. Requirements, governance, and build manifest agents generate structured outputs.
6. Scope approval pauses the flow.
7. Maestro BPMN run coordinates the lifecycle state and invokes the correct handoff.
8. UiPath API Workflow calls the reachable Factory API or Build Worker endpoint.
9. Build Worker invokes Codex in a bounded workspace.
10. Codex creates or updates the dashboard implementation and records changed-file evidence.
11. Automated checks run.
12. Release approval records the decision.
13. Sandbox deployment evidence is attached.
14. User opens the generated preview and evidence drawer.

## What Must Be Live For Checkpoint 7

Minimum acceptable target:

- live or approved runnable Maestro BPMN process in UiPath Automation Cloud,
- hosted or tunneled callback endpoint reachable from UiPath,
- at least one live UiPath API Workflow or human approval handoff connected to the request timeline,
- Fireworks provider path for clarification/planning when keys are configured,
- Codex readiness/live-run path with honest blocked state if the run is not approved,
- UI state driven by lifecycle endpoints rather than seeded walkthrough state,
- evidence ids recorded and visible in the product.

## What Can Remain Bounded

The product does not need to become an arbitrary production app factory in Checkpoint 7.

Acceptable scope limits:

- sandbox deployment instead of production deployment,
- Customer360 as the primary generated template,
- schema/sample/synthetic uploads only,
- deterministic fallback for no-key or provider failure states,
- Data Service/Test Cloud/UiPath Apps as stretch live evidence if Maestro and API Workflow are already live,
- public hosting only for the callback bridge if a tunnel is safer for the demo.

## Shortcuts To Avoid

Do not:

- claim UiPath is orchestrating the process if only local UI state is advancing,
- present import-ready assets as live platform execution,
- show pre-seeded clarification questions as if they were generated after submit,
- let Codex run without a bounded manifest, file allowlist, and evidence capture,
- expose raw prompts, API keys, trace payloads, or customer PII,
- overbuild a technical dashboard when the user-facing product should remain simple and premium.

## Checkpoint 7 Documentation Impact

Required doc changes:

- rename "UiPath Live Proof And Hosted Bridge" to "Maestro Cloud Orchestration",
- update worker prompt to require Maestro BPMN as the primary Track 2 target,
- update status and acceptance criteria to require a live or approved runnable Automation Cloud orchestration path,
- update final QA docs to verify Devpost alignment, video/demo story, and truth table,
- keep all live mutations explicitly approval-gated.
- call out the organizer-required UiPath Labs URL in README, Devpost copy, and
  the submission checklist.

## Open Decisions Before Launch

1. Which callback bridge should be used: Vercel preview, Cloudflare Tunnel, ngrok, or another approved host.
2. Whether Action Center task creation is approved for the first live human gate.
3. Whether Data Service record writes are approved in Checkpoint 7 or deferred.
4. Whether live Codex execution is approved during the checkpoint, or only readiness plus a manually triggered run.
