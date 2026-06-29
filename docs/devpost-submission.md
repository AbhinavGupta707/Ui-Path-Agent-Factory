# Devpost Submission Copy

Use this as draft copy for the UiPath AgentHack submission. Replace placeholder links before final submission.

## Project Title

Governed Agentic Automation Factory

## Tagline

UiPath as the enterprise control plane for coding agents that build governed business automations.

## Short Description

Governed Agentic Automation Factory turns a business request into a controlled coding-agent build. A user asks for a Customer360 analytics dashboard, UiPath-shaped agents clarify requirements and governance, approval gates control scope and release, a constrained Codex worker builds from a manifest, tests gate the result, and audit evidence records every step.

## Inspiration

Coding agents make it easy to generate internal tools quickly. That creates a new enterprise problem: shadow IT, unclear ownership, unreviewed code, unsafe data handling, missing tests, and uncontrolled deployment. We built a factory that keeps the speed of coding agents but puts UiPath in charge of orchestration, approvals, quality gates, and audit.

## What It Does

- Captures a Customer360 dashboard request through a controlled intake flow.
- Generates clarification questions for data sources, metrics, filters, PII policy, and ownership.
- Classifies governance risk and requires scope/data approval.
- Creates a machine-readable build manifest with approved templates, allowed files, forbidden actions, and sandbox-only policy.
- Routes the manifest through the API Workflow contract to a Build Worker for bounded Codex execution.
- Runs metric, PII masking, build, and smoke tests.
- Uses release approval before sandbox deployment.
- Shows a working Customer360 dashboard with synthetic data, masked PII, refresh proof, and audit linkage.
- Documents live UiPath assets and explicit approval boundaries.

## How We Built It

The repo is a TypeScript monorepo with:

- React/Vite Factory Console for the operator workflow.
- Node Factory API for local lifecycle state and audit events.
- Node Build Worker service for manifest validation, Codex command contracts, worker status, and guardrail evidence.
- React/Vite Customer360 dashboard plus deterministic metric utilities.
- Source-controlled UiPath assets for Maestro, Agent Builder, API Workflows, Action Center, Data Service, Apps, and Test Manager, plus an isolated UiPath Solutions deployment path for the Maestro process.

## UiPath Product Usage

| Product | Usage |
|---|---|
| Maestro BPMN | Main orchestration model for request -> approval -> build -> tests -> release -> deployment -> audit; solution-deployed as a live process/release in an isolated folder. |
| UiPath Agents / Agent Builder | Requirements, Clarification, Governance, Build Planner, and Test Summary agents. |
| Action Center | Scope/data and release approval contracts. |
| Data Service | Proposed state and audit data model. |
| API Workflows / Integration Service | Import-ready workflow calls for build worker, status, tests, deployment, and evidence callbacks, with trusted bridge token support. |
| Orchestrator | Verified folder context and planned runtime/asset control. |
| Test Manager/Test Cloud | Live quality-gate project, test set, and seven test cases. |
| UiPath Apps | Proposed companion intake/status surface. |
| UiPath for Coding Agents | Codex skill activation path through UiPath CLI local skills. |

## What Is Live Vs. Ready

- Live: Orchestrator folder, isolated solution-deployed Maestro process/release, Test Manager project/test set/test cases, and approved live Codex readiness/build evidence through the Build Worker.
- Runnable locally: Factory Console, Factory API, trusted callback bridge contract, Build Worker contract, Customer360 dashboard, tests, sandbox deployment evidence, and API Workflow local-runner handoff.
- Import-ready/validated: low-code Agent projects, API Workflow JSON assets, and source-level Maestro task bindings that still require live discovery before a completed cloud run.
- Proposal-only until approval: Data Service schema, Action Center contracts, UiPath Apps companion contract.
- Not claimed: production deployment, live Action Center task completion, live Data Service records, completed live Maestro run/process instance, cloud-packaged API Workflow execution, live Test Cloud execution.

## Track Alignment

This submission targets Track 2, UiPath Maestro BPMN. The product is a structured business process with agents, gateways, human approvals, API calls, quality gates, and audit records. The Customer360 dashboard is the proof artifact; the actual product is the governed build factory around coding agents.

## Business Impact

The factory addresses coding-agent sprawl inside enterprises. Teams can still move quickly, but every generated automation has:

- an owner;
- approved data scope;
- PII policy;
- constrained build manifest;
- branch/diff or PR evidence;
- tests and quality gates;
- release approval;
- sandbox deployment;
- audit trail.

## Technical Highlights

- Shared lifecycle schemas across API, UI, worker, and UiPath contracts.
- Manifest-first Codex execution pattern with sandbox-only and allowed-file controls.
- Deterministic Customer360 metric layer and refresh mutation proof.
- PII masking tests that fail if raw names, emails, or phones appear.
- Live Test Manager catalog for release gate evidence.
- Explicit platform mode labels: `local-simulated`, `uipath-ready`, `uipath-live`.

## Known Limitations

- Data Service schema creation is not run until explicitly approved.
- Maestro BPMN is validated and solution-deployed live, but a completed Maestro run is not claimed. Direct publish fails with UiPath `Invalid argument 'Period'`; the solution path creates the process/release, and runtime start still needs executable API Workflow/Action/Agent bindings before it will produce a process instance/task.
- Low-code agents validate locally but are not uploaded or run; API Workflow JSON assets validate locally and `AgentFactory_StartBuildWorker` succeeded through the local UiPath API Workflow runner.
- Action Center and UiPath Apps remain proposal-only contracts.
- `AgentFactory_StartDeployment` targets the implemented local `POST /deploy` sandbox endpoint for deployment evidence.
- The default Build Worker runtime reports `blocked` until a live Codex/Git runner is injected; the approved activation run passed live Codex readiness/build and generated sandbox evidence.
- The demo uses synthetic Customer360 data only.

## Links To Fill In

- GitHub repository: `TODO`
- Demo video: `TODO`
- Hosted preview or local run instructions: see `README.md` and `docs/setup.md`
- Slides/deck: `TODO`

## License

MIT.
