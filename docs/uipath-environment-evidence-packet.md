# Governed Agentic Automation Factory

## Supplemental UiPath Environment Evidence Packet

| Field | Value |
|---|---|
| Project | Governed Agentic Automation Factory |
| Hackathon | UiPath AgentHack |
| Track | Track 2: UiPath Maestro BPMN |
| Public repository | https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory |
| Prepared | 2026-06-30 |
| Primary local product URL | http://localhost:5183 |
| Customer360 preview URL | http://localhost:5184 |

## Purpose

The Devpost form asks for the UiPath Labs link/environment URL where the
solution was built. The separate UiPath Labs staging sandbox URL was not
provisioned before the access-request window closed. The project was built,
verified, and documented in a UiPath Automation Cloud organization owned by the
submitter.

This packet does not claim to replace an organizer-assigned staging sandbox. It
provides the practical review evidence judges need to inspect the UiPath side of
the project: organization, tenant, folder, UiPath components, proof IDs,
read-only verification commands, setup path, and safety boundaries.

## Recommended Devpost Environment Field

If the Devpost form requires the environment URL and the assigned Labs staging
URL is not available, use the Automation Cloud organization URL and attach this
evidence pack:

```text
https://cloud.uipath.com/galacticus/
```

Tenant deep link:

```text
https://cloud.uipath.com/galacticus/DefaultTenant/
```

Suggested Devpost note:

```text
UiPath Labs staging access was not provisioned before the sandbox window closed,
so I built and verified the project in my Automation Cloud org instead:
https://cloud.uipath.com/galacticus/. The supplemental evidence packet includes
org, tenant, folder, proof IDs, verification commands, and UiPath component
mapping for judges.
```

## Requirement Interpretation

The official UiPath AgentHack material emphasizes a working prototype, a public
GitHub repository, a demo video, a presentation deck, clear setup instructions,
and meaningful use of UiPath Automation Cloud. The organizer follow-up email
also asks the repository README to clearly state the project description,
UiPath components, agent type, and setup instructions.

This repository now includes those README sections and this packet adds a
compact environment proof trail. If judges strictly require an
organizer-assigned staging URL, organizer confirmation is still needed.

## UiPath Environment Identity

| Field | Value |
|---|---|
| Base URL | https://cloud.uipath.com |
| Organization logical name | galacticus |
| Organization ID | 1aa6cebf-ee8e-4fec-8520-b7971407d266 |
| Tenant name | DefaultTenant |
| Tenant ID | 360e9052-0ec2-4b79-b879-e6c7f992c443 |
| Primary folder name | AgentFactoryDemo |
| Primary folder ID | 7986306 |
| Primary folder key | cba41e19-47cc-4a0a-bf73-de88b60a61be |
| Primary folder path | AgentFactoryDemo |
| Folder type | Standard |
| Folder description | Governed Agentic Automation Factory hackathon demo folder |
| Isolated solution folder | AgentFactoryDemoLiveSpine 1 |
| Isolated solution folder ID | 7989142 |
| Isolated solution folder key | d991e64c-d0ad-4ec6-9798-8783b166a073 |

## CLI Evidence

Read-only verification commands used on 2026-06-30:

```bash
uip login status --output json
uip login tenant list --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testsets list --project-key AFQG --output json
uip tm testcases list --project-key AFQG --output json
uip maestro bpmn process list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 --output json
uip or processes list --folder-key d991e64c-d0ad-4ec6-9798-8783b166a073 --output json
```

Observed results:

- Login status returned `Logged in` for `https://cloud.uipath.com`,
  organization `galacticus`, tenant `DefaultTenant`.
- Tenant list returned `DefaultTenant` with tenant ID
  `360e9052-0ec2-4b79-b879-e6c7f992c443`.
- Folder discovery returned `AgentFactoryDemo` with folder ID `7986306` and
  folder key `cba41e19-47cc-4a0a-bf73-de88b60a61be`.
- Test Manager project discovery returned project key `AFQG`.
- Test Manager test set discovery returned `Customer360 Release Gate`
  (`AFQG:1`).
- Test Manager test case discovery returned seven release-gate test cases.
- Maestro/Orchestrator process discovery returned the solution-deployed
  process `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build`
  version `1.0.1`.

## Product Summary

Governed Agentic Automation Factory turns a business request into a governed
coding-agent build. A user asks for an internal business app, such as a
Customer360 analytics dashboard. UiPath-shaped agents clarify requirements and
governance. Human gates control scope and release. A manifest constrains the
Codex worker. Tests and audit evidence decide whether the sandbox preview is
safe to review.

The product solves the enterprise trust problem around coding agents: fast app
generation is useful only when the organization can own the result, including
data scope, PII policy, approvals, tests, release control, and audit.

## End-To-End Workflow

```text
business request
  -> AI-generated clarifications
  -> requirements/spec generation
  -> governance assessment
  -> scope approval
  -> approved build manifest
  -> API Workflow / Build Worker handoff
  -> constrained Codex build
  -> metric, PII, build, and smoke gates
  -> release approval
  -> Customer360 sandbox preview
  -> evidence ledger
```

## UiPath Components Used

| UiPath component | Role | Evidence location |
|---|---|---|
| Maestro BPMN | Request-to-release orchestration spine for intake, agent work, human gates, build handoff, tests, release, deployment, and audit. | `uipath/maestro/customer360-build/`, solution deployment evidence docs |
| Agent Builder / UiPath Agents | Requirements, Clarification, Governance, Build Planner, and Test Summary agents. | `uipath/agents/AgentFactoryAgents/` |
| Coded agents / coded runtime | Server-side model-backed lifecycle endpoints for clarification, requirements/spec, governance, and build planning. | `services/factory-api` |
| UiPath for Coding Agents / Codex | Manifest-constrained coding-agent execution path for bounded repository work. | `services/build-worker`, `docs/uipath-setup.md` |
| Action Center | Scope/data and release approval contracts. | `uipath/action-center/` |
| API Workflows / Integration Service | StartBuildWorker, FetchBuildStatus, PostStatusUpdate, RecordTestResult, StartDeployment, and RecordUiPathEvent handoffs. | `uipath/api-workflows/` |
| Data Service | Proposed durable state and audit schema for requests, manifests, approvals, tests, deployments, and events. | `uipath/data-service/schema.json` |
| Orchestrator | Automation Cloud folder, process visibility, runtime boundary, and future assets/jobs. | `docs/uipath-setup.md` |
| Test Manager / Test Cloud | Live quality-gate catalog for Customer360 release evidence. | `uipath/test-cloud/quality-gate-assets.json` and read-only CLI checks |
| UiPath Apps | Companion intake/status contract for a future low-code operator surface. | `uipath/apps/` |

## Agent Type

The solution uses both low-code agents and coded agents.

- Low-code UiPath Agents: Requirements Agent, Clarification Agent, Governance
  Agent, Build Planner Agent, and Test Summary Agent are represented as UiPath
  Agent Builder assets.
- Coded agents / coded runtime: Factory API lifecycle endpoints use
  model-backed reasoning when Fireworks and LangSmith are configured.
- Coding agent: Codex is used through a manifest-constrained Build Worker
  pattern with approved metrics, allowed files, forbidden actions, PII policy,
  sandbox-only deployment, and repair limits.

## Agent And Workflow Responsibilities

| Actor | Responsibility |
|---|---|
| Requirements Agent | Converts intent and answers into a structured app spec. |
| Clarification Agent | Identifies missing data, metric, PII, refresh, and ownership details. |
| Governance Agent | Assesses data policy, risk, approval requirements, and blocked actions. |
| Build Planner Agent | Produces the manifest that constrains the coding-agent worker. |
| Test Summary Agent | Summarizes quality-gate evidence for release approval. |
| Build Worker | Validates the manifest, records guardrail checks, queues Codex execution, and returns artifact evidence. |
| Factory API | Stores lifecycle state, receives trusted callback evidence, and exposes the evidence timeline. |
| Customer360 dashboard | Proves the generated app artifact with masked synthetic analytics. |

## Live UiPath Proof

| Evidence | Value |
|---|---|
| Orchestrator folder | `AgentFactoryDemo` |
| Folder ID / key | `7986306` / `cba41e19-47cc-4a0a-bf73-de88b60a61be` |
| Isolated solution folder | `AgentFactoryDemoLiveSpine 1` |
| Isolated solution folder ID / key | `7989142` / `d991e64c-d0ad-4ec6-9798-8783b166a073` |
| Solution package | `AgentFactoryMaestroSolutionBridgeSpine` |
| Solution version | `1.0.1` |
| Solution package version key | `53399a60-1edb-4d51-a054-29b17533932c` |
| Solution deployment key | `427de334-ba5e-4e95-bba1-d053abdad2f4` |
| Pipeline deployment ID | `0558837f-54a8-4526-10b1-08ded6011ef2` |
| Activation status | `SuccessfulActivate` / active |
| Maestro process name | `agent-factory-customer360-build` |
| Maestro process key | `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build` |
| Package process key | `AgentFactoryMaestroSolutionBridgeSpine.Agentic.customer360-build:1.0.1` |
| Release key | `70d07489-d32a-4f56-9f5e-5fadaf8b14e6` |
| Feed ID | `e4c3d330-c071-4dc1-9bb9-9a18c65dfd83` |
| Test Manager project | `Agent Factory Quality Gates` / `AFQG` |
| Test Manager project ID | `2760d770-7e82-0000-66f7-0b49d3053e3f` |
| Test set | `Customer360 Release Gate` / `AFQG:1` |
| Test set ID | `66cdd3ea-c873-0200-58fb-0b49d305588a` |
| Test case count | 7 |
| Codex readiness session | `019f14f9-8e3b-7232-9d59-6ee2c428279f` |
| Local product request ID | `REQ-2026-001` |
| Local build run ID | `BUILD-REQ-2026-001-001` |
| Local deployment ID | `DEP-REQ-2026-001-001` |

## Read-Back Verification

The evidence was read back with CLI discovery, not inferred from source files
alone:

- `uip login status` confirmed the Automation Cloud organization and tenant.
- `uip or folders get AgentFactoryDemo` confirmed folder identity.
- `uip tm project list`, `uip tm testsets list`, and `uip tm testcases list`
  confirmed live Test Manager catalog records.
- `uip maestro bpmn process list` and `uip or processes list` confirmed the
  solution-deployed Maestro process and Orchestrator process release metadata.
- The solution activation and Codex/build evidence are recorded in
  `docs/orchestration/checkpoint-7/live-activation-evidence-2026-06-29.md` and
  `docs/orchestration/checkpoint-7/maestro-solution-activation-evidence-2026-06-29.md`.

## Judge Reproduction Path

1. Clone the repository:

   ```bash
   git clone https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory.git
   cd Ui-Path-Agent-Factory
   ```

2. Install dependencies and run the local verification suite:

   ```bash
   npm install
   npm run smoke
   ```

3. Configure git-ignored local provider settings if available:

   ```bash
   npm run setup:live
   ```

4. Start the full local product stack:

   ```bash
   npm run dev:live
   ```

5. Open `http://localhost:5183`, submit the Customer360 request, review
   clarifications, generate the build plan, approve scope, inspect live-run
   evidence, approve release, and open the Customer360 sandbox preview.

6. Optional read-only UiPath verification:

   ```bash
   uip login status --output json
   uip or folders get AgentFactoryDemo --output json
   uip tm project list --limit 5 --output json
   uip tm testsets list --project-key AFQG --output json
   uip tm testcases list --project-key AFQG --output json
   ```

## Submission File Recommendations

Upload `Agent-Factory-UiPath-Evidence-Pack.zip` as a supplemental Devpost
artifact if the form allows attachments. If only one file can be uploaded, use
`Agent-Factory-UiPath-Environment-Evidence-Packet.pdf`.

The ZIP contains:

- this PDF packet;
- this Markdown packet;
- machine-readable evidence manifest JSON;
- repository README;
- setup and component map docs;
- Devpost submission copy and checklist;
- hackathon requirements analysis;
- live activation evidence docs;
- UiPath setup and live-spine activation docs;
- demo recording script;
- submission deck;
- generated evidence pack README.

## Safety, Privacy, And Boundaries

- The Customer360 dataset is synthetic.
- Names are tokenized; emails and phone numbers are suppressed.
- No real customer records, PHI, payer data, provider credentials, or live
  production systems are included.
- Provider keys, bridge tokens, `.env.local`, raw traces, generated build
  outputs, and local credential files are not included.
- Data Service schema creation and records remain approval-gated.
- Action Center task creation/completion remains approval-gated.
- Test Cloud execution remains approval-gated.
- Maestro solution deployment exists, but a full live process instance/job/task
  has not been claimed.
- The local sandbox preview is the app artifact; no public hosted sandbox URL is
  claimed in this packet.

## Claim Boundary

This packet supports the claim that Agent Factory was built, verified, and
documented in UiPath Automation Cloud with live folder, Test Manager catalog,
and solution-deployed Maestro process evidence. It does not claim that the
missing UiPath Labs staging URL was assigned, that production deployment was
performed, or that live Action Center/Data Service/Test Cloud mutations were run
without explicit approval.
