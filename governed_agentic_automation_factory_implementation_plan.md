# Governed Agentic Automation Factory - Orchestrated Implementation Plan

**Purpose:** execution-ready plan for building the UiPath AgentHack submission with Codex worktree orchestration.  
**Track:** UiPath AgentHack 2026, Track 2 - UiPath Maestro BPMN.  
**Target outcome:** a live, beautiful, end-to-end product where UiPath is the execution and governance layer, Codex is a constrained coding worker, and the generated Customer360 dashboard is a real deployable artifact.  
**Last updated:** 2026-06-28.

---

## 1. Hackathon-Aligned Product Thesis

UiPath AgentHack explicitly asks for a real working solution on UiPath Automation Cloud, not a concept or slide deck. Track 2 rewards a BPMN 2.0 process in Maestro that orchestrates humans, robots, agents, and APIs through clear tasks, decisions, and handoffs. The challenge page also emphasizes UiPath as the orchestration and governance layer for agentic systems, and gives bonus points for using UiPath for Coding Agents with tools such as Codex.

This project should therefore be presented as:

> The enterprise control plane for coding agents: business users request internal tools, UiPath agents clarify and govern the request, humans approve risk and release, Codex builds inside a constrained sandbox, tests and Test Cloud gate release, and Maestro coordinates the entire lifecycle from intake to deployment and audit.

The generated Customer360 dashboard is the proof artifact, not the whole product. The product is the governed build factory.

### Scoring Strategy

| Judging criterion | Implementation proof |
|---|---|
| Business Impact & Adoption Potential | Addresses coding-agent sprawl, shadow IT, unsafe data usage, unreviewed app generation, and weak deployment governance. |
| Platform Usage | Maestro BPMN is the main lifecycle. Agent Builder/Agents create structured specs and governance decisions. Data Service stores state. Action Center gates approvals. API Workflows call the build worker. Orchestrator stores assets/jobs. Test Cloud or Test Manager records release quality. UiPath for Coding Agents installs Codex skills. |
| Technical Execution, Feasibility & Versatility | Real Codex run, real file generation, branch/PR/diff, tests, PII guardrails, failure path, deployment gate, audit trail, refresh proof. |
| Completeness | End-to-end prototype: request -> clarification -> approval -> manifest -> build -> tests -> release approval -> deployment -> audit. |
| Creativity & Innovation | UiPath governs coding agents as enterprise builders, not just RPA bots. |
| Presentation | Beautiful Factory Console, live Maestro/status walkthrough, generated dashboard, clear five-minute narrative. |
| Coding Agent Bonus | Codex invoked through a constrained worker with UiPath CLI skills installed via `uip skills install --agent codex`. |

---

## 2. Product Shape

### Keep The Product Deep, Not Broad

The build must feel robust without chasing every possible integration. The high-value integrations are:

1. **Maestro BPMN:** canonical orchestration spine.
2. **UiPath Agents / Agent Builder:** requirements, clarification, governance, build planning, test summary.
3. **Action Center:** human scope approval and release approval.
4. **Data Service:** request/spec/manifest/build/test/deploy/audit state.
5. **API Workflows / Integration Service:** controlled calls into the Build Worker, GitHub, deployment, and optional Test Cloud/Test Manager update.
6. **Orchestrator:** jobs, assets, credentials, process execution visibility.
7. **UiPath for Coding Agents:** Codex skills installed and shown in setup/demo.
8. **Test Cloud:** high-value quality gate if access is available; otherwise show Test Cloud-ready integration plus CI evidence.
9. **GitHub:** PR/diff evidence.
10. **Vercel or sandbox web host:** generated dashboard deployment.

Defer or avoid:

- Slack/Teams.
- Multiple working templates.
- Production environment deployment.
- Real customer data.
- Broad arbitrary app generation.
- Deep external CRM/Snowflake/Salesforce connectors unless the rest is already stable.

### UI Surface Decision

Use a hybrid UI approach:

1. **Factory Console - custom web app**
   - Primary polished demo surface.
   - Shows request intake, clarification, policy decisions, BPMN progress, approvals, Codex logs, PR, tests, deployment, and audit timeline.
   - Can be built with React/Vite/Next and a clean enterprise UI.

2. **UiPath Apps - enterprise intake/status companion**
   - Shows official UiPath-facing request submission/status.
   - Starts or references Orchestrator/Maestro process where possible.
   - Binds to Data Service records where possible.
   - Proves UiPath is not decorative.

3. **Generated Customer360 Dashboard - Codex output artifact**
   - Separate generated app.
   - Built/modified by the build worker using Codex.
   - Deployed to sandbox/Vercel after approval.
   - Shows analytics, masked PII, refresh timestamp, tests, and live data mutation.

This gives a beautiful UX while keeping UiPath central.

---

## 3. Architecture

```text
Business User
  |
  | submit request / answer clarifications
  v
Factory Console (custom web UI)  <---- optional mirrored intake/status ----  UiPath Apps
  |
  | create request / read timeline
  v
Factory API / Local Product Backend
  |
  | sync state, trigger platform flow
  v
UiPath Automation Cloud
  |
  +-- Data Service
  |     - AutomationRequest
  |     - StructuredSpec
  |     - GovernanceAssessment
  |     - ApprovalTask
  |     - BuildManifest
  |     - BuildRun
  |     - TestRun
  |     - DeploymentRecord
  |     - AuditEvent
  |
  +-- Maestro BPMN
  |     request intake -> requirements -> clarification gateway
  |     -> governance -> scope approval -> manifest
  |     -> trigger build worker -> test gate -> release approval
  |     -> sandbox deployment -> audit summary
  |
  +-- UiPath Agents / Agent Builder
  |     - Requirements Agent
  |     - Clarification Agent
  |     - Governance Agent
  |     - Build Planner Agent
  |     - Test Summary Agent
  |
  +-- Action Center
  |     - data/scope approval
  |     - release approval
  |
  +-- API Workflows / Integration Service / Orchestrator
        |
        | POST /build, GET /build/:id, POST /deploy
        v
Build Worker Service
  |
  +-- create isolated workspace from customer360 template
  +-- write build_manifest.json and AGENTS.md
  +-- run `codex exec --sandbox workspace-write --json`
  +-- run tests/scans
  +-- commit branch / open GitHub PR
  +-- deploy generated dashboard to sandbox/Vercel
  +-- return logs, artifact URLs, PR URL, test report
```

---

## 4. Repository Target Structure

The repo should evolve from one PRD file into a runnable monorepo:

```text
.
├── README.md
├── LICENSE
├── governed_agentic_automation_factory_final_build_spec.md
├── governed_agentic_automation_factory_implementation_plan.md
├── docs/
│   ├── demo-script.md
│   ├── uipath-setup.md
│   ├── data-service-schema.md
│   ├── maestro-bpmn.md
│   ├── agent-prompts.md
│   ├── action-center-approvals.md
│   ├── test-cloud.md
│   └── orchestration-log.md
├── apps/
│   ├── factory-console/
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── generated-customer360-template/
│       ├── src/
│       ├── public/data/
│       ├── tests/
│       ├── package.json
│       └── README.md
├── services/
│   ├── factory-api/
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── build-worker/
│       ├── src/
│       ├── prompts/
│       ├── templates/
│       ├── package.json
│       └── README.md
├── packages/
│   ├── shared-contracts/
│   └── customer360-metrics/
├── uipath/
│   ├── data-service/
│   │   └── schema.json
│   ├── maestro/
│   │   ├── bpmn-export-or-notes.md
│   │   └── process-contract.json
│   ├── agents/
│   │   ├── requirements-agent.md
│   │   ├── clarification-agent.md
│   │   ├── governance-agent.md
│   │   ├── build-planner-agent.md
│   │   └── test-summary-agent.md
│   ├── action-center/
│   │   └── approval-contracts.md
│   └── test-cloud/
│       └── test-plan.md
├── scripts/
│   ├── dev-reset.sh
│   ├── seed-request.ts
│   ├── mutate-customer360-data.ts
│   └── smoke-demo.ts
└── .agents/
    └── skills/
```

Use this structure as the desired target; implementation lanes may create only the pieces needed for each checkpoint.

---

## 5. Activation And Access Checks

Diagnose in layer order. Before debugging runtime behavior, confirm the relevant feature exists and is activated.

### Local Baseline

Current local facts:

- `codex` is installed locally and supports `codex exec --sandbox workspace-write --json`.
- `uip` was not found on PATH during initial inspection.
- The current folder was not a git repository during initial inspection.
- The current workspace contains only the PRD and this implementation plan.

### Required Local Setup

1. Initialize or attach a GitHub-backed repository.
2. Install Node dependencies after scaffolding.
3. Install UiPath CLI:
   ```bash
   npm install -g @uipath/cli
   uip --version
   ```
4. Install Codex UiPath skills:
   ```bash
   uip skills install --agent codex --local
   ```
5. Authenticate only when live UiPath commands are needed:
   ```bash
   uip login
   ```
6. Confirm `codex exec --help` and `uip skills install --help`.

### UiPath Automation Cloud Activation

Confirm in this order:

1. UiPath Labs / Automation Cloud tenant access.
2. Maestro enabled.
3. Apps enabled.
4. Data Service enabled.
5. Action Center enabled.
6. Agents / Agent Builder available.
7. API Workflows / Studio Web available.
8. Orchestrator folder, robot/runtime, assets access.
9. Test Cloud / Test Manager access.
10. External app or PAT auth available for APIs if needed.

If a feature is missing from the tenant, document it in `docs/uipath-setup.md` and use the planned fallback while preserving the platform story.

---

## 6. Data Model

### Canonical Statuses

Use one shared enum across Factory Console, Factory API, Build Worker, and UiPath docs:

```text
draft
clarifying
awaiting_scope_approval
approved_for_build
manifest_created
build_queued
building
build_failed
tests_running
tests_failed
awaiting_release_approval
deploying
deployed
blocked
cancelled
```

### Entities

Minimum production-shaped schema:

```text
AutomationRequest
- request_id
- requester_name
- requester_email
- request_text
- requested_artifact_type
- template_id
- status
- priority
- owner_name
- owner_email
- created_at
- updated_at

StructuredSpec
- spec_id
- request_id
- business_goal
- data_sources_json
- metrics_json
- filters_json
- output_type
- owner
- constraints_json
- clarification_questions_json
- clarification_answers_json
- created_at
- updated_at

GovernanceAssessment
- assessment_id
- request_id
- risk_tier
- pii_detected
- pii_policy
- forbidden_actions_json
- required_approvals_json
- policy_decisions_json
- policy_violations_json
- created_at

ApprovalTask
- task_id
- request_id
- approval_type
- approver_role
- approver_name
- approver_email
- status
- comments
- created_at
- completed_at

BuildManifest
- manifest_id
- request_id
- manifest_hash
- template_id
- artifact_type
- allowed_files_json
- approved_data_sources_json
- approved_metrics_json
- required_filters_json
- pii_policy
- forbidden_actions_json
- output_targets_json
- max_repair_attempts
- sandbox_only
- created_at

BuildRun
- build_run_id
- request_id
- manifest_id
- status
- worker_id
- codex_session_id
- branch_name
- commit_sha
- pr_url
- generated_files_json
- logs_uri
- started_at
- completed_at

TestRun
- test_run_id
- build_run_id
- status
- test_provider
- tests_passed
- tests_failed
- report_uri
- report_json
- quality_gate_decision
- created_at

DeploymentRecord
- deployment_id
- build_run_id
- environment
- status
- app_url
- deployment_provider
- deployment_id_external
- rollback_ref
- created_at
- completed_at

AuditEvent
- event_id
- request_id
- actor_type
- actor_name
- action
- summary
- payload_json
- timestamp
```

### Local Development Store

For speed, local product code can use SQLite or JSON files first, with adapters shaped like Data Service. The UI should label the live mode honestly:

- `platformMode: "uipath-live"` when connected to UiPath.
- `platformMode: "local-simulated"` when using local dev store.

The demo should prioritize live UiPath where access exists. If some platform component is unavailable, keep the fallback explicit and show what is live.

---

## 7. API Contracts

### Factory API

Used by Factory Console and optionally mirrored by UiPath API Workflows.

#### `POST /api/requests`

Creates request and first audit event.

```json
{
  "requester_name": "Avery Morgan",
  "requester_email": "avery@example.com",
  "request_text": "I need a Customer360 analytics dashboard...",
  "owner_name": "Revenue Ops",
  "owner_email": "revops@example.com"
}
```

Response:

```json
{
  "request_id": "REQ-2026-001",
  "status": "clarifying"
}
```

#### `POST /api/requests/:request_id/clarify`

Runs or simulates Requirements + Clarification Agent.

Response:

```json
{
  "spec_id": "SPEC-REQ-2026-001",
  "questions": [
    {
      "id": "pii_policy",
      "question": "Can individual customer names and emails be displayed?",
      "default": "Mask names/emails/phones"
    }
  ],
  "status": "clarifying"
}
```

#### `POST /api/requests/:request_id/answers`

Stores clarification answers and moves to governance.

#### `POST /api/requests/:request_id/govern`

Runs Governance Agent and creates required approval tasks.

#### `POST /api/requests/:request_id/approve-scope`

Approves scope/data policy. In live UiPath mode, this mirrors Action Center completion.

#### `POST /api/requests/:request_id/manifest`

Creates build manifest and hash.

#### `POST /api/builds`

Queues Build Worker.

```json
{
  "request_id": "REQ-2026-001",
  "manifest_id": "MAN-REQ-2026-001",
  "mode": "sandbox"
}
```

#### `GET /api/requests/:request_id/timeline`

Returns all status events for the Factory Console.

### Build Worker API

#### `POST /build`

Receives approved manifest and starts isolated build.

```json
{
  "request_id": "REQ-2026-001",
  "manifest": {
    "template_id": "customer360_dashboard_v1",
    "sandbox_only": true,
    "pii_policy": "mask_email_name_phone"
  },
  "callbacks": {
    "status_url": "https://factory.example.com/api/build-callback"
  }
}
```

Response:

```json
{
  "build_run_id": "BUILD-REQ-2026-001",
  "status": "build_queued"
}
```

#### `GET /build/:build_run_id`

Returns build status, logs, generated files, branch, PR, test report, deployment URL.

#### `POST /deploy`

Deploys approved generated app after release approval.

---

## 8. Build Worker Contract

### Responsibilities

1. Validate manifest schema.
2. Refuse unapproved template IDs.
3. Create isolated workspace:
   ```text
   runs/REQ-2026-001/workspace
   ```
4. Copy Customer360 template.
5. Write:
   - `build_manifest.json`
   - `AGENTS.md`
   - generated request context
6. Run Codex:
   ```bash
   codex exec --sandbox workspace-write --json --skip-git-repo-check \
     "Using build_manifest.json and AGENTS.md, generate the Customer360 dashboard, tests, and README. Do not access production systems. Do not write secrets. Do not show raw PII."
   ```
7. Capture JSONL logs.
8. Run package install/build/tests.
9. Run guardrail scans.
10. Create git branch or diff.
11. Open PR if GitHub token is available.
12. Return status to Factory API / UiPath workflow.

### Guardrail Enforcement

The worker must fail fast if:

- manifest requests production deployment;
- generated code contains raw names/emails/phones in rendered UI;
- generated code reads env secrets not on allowlist;
- generated code attempts external network calls other than approved package install/deploy/GitHub;
- tests fail after one bounded repair attempt;
- generated files escape the allowed workspace.

### Build Manifest Required Fields

```json
{
  "request_id": "REQ-2026-001",
  "template_id": "customer360_dashboard_v1",
  "artifact_type": "dashboard_app",
  "approved_data_sources": [
    "synthetic_customers_csv",
    "synthetic_orders_csv",
    "synthetic_events_csv",
    "synthetic_returns_csv"
  ],
  "approved_metrics": [
    "revenue",
    "average_order_value",
    "repeat_purchase_rate",
    "purchase_frequency",
    "return_rate",
    "segment_revenue",
    "cohort_retention",
    "churn_risk_proxy"
  ],
  "required_filters": [
    "date_range",
    "channel",
    "product_category",
    "segment"
  ],
  "pii_policy": "mask_email_name_phone",
  "output_targets": [
    "dashboard_app",
    "data_transform",
    "metric_tests",
    "readme",
    "deployment_manifest"
  ],
  "allowed_files": [
    "src/**",
    "tests/**",
    "public/data/**",
    "README.md",
    "deployment.json",
    "package.json"
  ],
  "forbidden_actions": [
    "production_deploy",
    "external_network_without_approval",
    "secret_access",
    "delete_existing_files",
    "log_raw_pii"
  ],
  "max_repair_attempts": 1,
  "sandbox_only": true
}
```

---

## 9. UiPath Implementation Details

### Maestro BPMN

Use Maestro as the lifecycle owner. The BPMN should be predictable, Track 2 aligned, and visually legible.

Main path:

1. Start event: request submitted.
2. Service/agent task: Requirements Agent creates structured spec.
3. Exclusive gateway: required fields missing?
4. User task or agent task: clarification.
5. Service/agent task: Governance Agent classifies risk.
6. Exclusive gateway: approval required?
7. Action Center task: scope/data approval.
8. Service task: Template Selector selects `customer360_dashboard_v1`.
9. Service/agent task: Build Planner creates manifest.
10. Service/API Workflow task: trigger Build Worker.
11. Intermediate status updates while building.
12. Exclusive gateway: build succeeded?
13. Service/API Workflow task: run tests / record Test Cloud result.
14. Exclusive gateway: tests pass?
15. Action Center task: release approval.
16. Service/API Workflow task: deploy sandbox app.
17. Service task: record audit summary.
18. End event: dashboard available.

Exception paths:

- PII blocked or masked.
- Unsupported source sends user back to clarification.
- Build failure triggers one repair attempt.
- Test failure triggers one repair attempt or human exception.
- Deployment failure creates rollback/exception task.

### UiPath Agents

Agent prompts live in `uipath/agents/` and `docs/agent-prompts.md`.

1. **Requirements Agent**
   - Input: raw request.
   - Output: structured spec plus missing fields.
   - Must not approve data access.

2. **Clarification Agent**
   - Input: structured spec with missing fields.
   - Output: 3-6 focused questions and updated spec after answers.
   - Avoid open-ended chats.

3. **Governance Agent**
   - Input: structured spec.
   - Output: risk tier, PII decision, approval requirements, forbidden actions.
   - Uses guardrails and deterministic policy table.

4. **Build Planner Agent**
   - Input: approved spec and governance result.
   - Output: build manifest.
   - Must choose only approved templates.

5. **Test Summary Agent**
   - Input: test results, logs, coverage notes.
   - Output: release recommendation and human-readable summary.

### Action Center

Two approval moments must be visible:

1. **Scope/Data Approval**
   - Approver sees request, structured spec, selected data sources, PII policy, risks.
   - Outcomes: Approve, Request Changes, Reject.

2. **Release Approval**
   - Approver sees generated artifact URL, PR/diff, tests, PII scan, deployment target.
   - Outcomes: Approve Sandbox Deploy, Request Fix, Reject.

### Data Service

Use Data Service as the audit/state system of record where possible. If live Data Service API access is not ready, mirror the schema locally and document the Data Service schema for import/manual setup.

### API Workflows / Integration Service

Use API Workflows for deterministic platform-to-service calls:

- `CreateBuildRun`
- `TriggerBuildWorker`
- `FetchBuildStatus`
- `RecordTestResult`
- `DeploySandboxArtifact`

If a custom connector is faster than API Workflow, create a minimal custom connector for Build Worker. Do not spend time on Slack/Teams connectors.

### Orchestrator

Use Orchestrator for:

- assets/secrets;
- published process references used by Apps;
- job execution visibility;
- folder-level access;
- audit/log visibility.

Store secrets in Orchestrator Assets or server environment variables, never in manifests or Data Service.

### Test Cloud

Target: visible quality gate.

Preferred implementation:

- Local generated tests always run first.
- Test Summary Agent summarizes results.
- Test Cloud/Test Manager records or displays test case/test run evidence if access is available.
- Factory Console shows a Test Cloud quality-gate panel with a live link or status.

Fallback:

- Run CI/local tests and include Test Cloud setup docs.
- Label as `Test Cloud-ready` only if live integration is not available.

Do not block the whole product on Test Cloud API setup if the main Maestro + Codex + approval flow is working.

---

## 10. UI / UX Requirements

### Factory Console

The custom UI should feel like a serious enterprise operations console, not a marketing landing page.

Primary views:

1. **Request Intake**
   - Large but restrained request composer.
   - Data source toggles.
   - Metric checkboxes.
   - PII policy selector.
   - Owner field.

2. **Clarification Workspace**
   - Agent-generated questions.
   - Editable answers.
   - Structured spec preview.

3. **Governance Review**
   - Risk tier.
   - PII decisions.
   - Forbidden actions.
   - Required approvals.

4. **Build Manifest**
   - JSON manifest viewer.
   - Template selected.
   - Allowed files.
   - Sandbox-only flag.

5. **Build Run**
   - Live timeline.
   - Codex JSONL log snippets.
   - Generated file list.
   - Branch/PR link.

6. **Quality Gate**
   - Unit tests.
   - PII scan.
   - Schema validation.
   - Smoke test.
   - Refresh test.
   - Test Cloud status.

7. **Deployment**
   - Release approval status.
   - Deployment URL.
   - Rollback ref.
   - Data freshness.

8. **Audit Trail**
   - Every state transition with actor, timestamp, and payload summary.

Design requirements:

- Use a dense, polished enterprise dashboard aesthetic.
- Avoid giant hero sections.
- Use badges, timelines, tables, tabs, drawers, and split panes.
- Show real status changes rather than static cards.
- Include empty/loading/error/degraded states.
- Make UiPath components visible in the product UI with source labels: Maestro, Action Center, Data Service, Test Cloud, Codex worker.

### Generated Customer360 Dashboard

Must be visually beautiful and clearly generated as an artifact.

Required UI:

- KPI strip: revenue, AOV, repeat purchase rate, return rate, churn-risk customers.
- Revenue time series.
- Segment revenue table.
- Top categories chart.
- Funnel/event summary.
- Cohort/retention section or proxy.
- Churn-risk/opportunity panel.
- PII masking indicator.
- Data freshness timestamp.
- Refresh button.
- Link back to Factory Console request/audit.

Live proof:

- Run `scripts/mutate-customer360-data.ts` or equivalent.
- Refresh dashboard.
- Show KPI changes.

---

## 11. Testing And Acceptance Criteria

### Required Automated Tests

Factory API:

- request creation
- clarification output shape
- governance decision
- manifest validation
- build status transitions
- audit event creation

Build Worker:

- manifest schema validation
- allowed template enforcement
- workspace isolation
- Codex command construction
- generated file capture
- failed test repair attempt limit
- no raw PII scan

Customer360:

- metric calculations
- schema validation
- PII masking
- empty/missing data behavior
- refresh mutation changes output
- dashboard smoke test

Factory Console:

- basic render smoke
- request flow UI
- build timeline UI
- quality gate UI
- deployed dashboard link UI

### Manual Demo Acceptance

A judge should be able to watch:

1. Request entered.
2. Clarification questions appear.
3. Spec and governance policy appear.
4. Human approval gate shown.
5. Manifest generated.
6. Codex worker runs and modifies files.
7. PR/diff appears.
8. Tests run and pass.
9. Release approval shown.
10. Dashboard deployed.
11. Data mutation changes dashboard.
12. Audit trail records every step.

### Non-Acceptable End States

- Dashboard exists but no Codex file generation occurred.
- Build button jumps to final UI.
- No approval gate.
- No tests.
- No audit trail.
- UiPath only appears in README or screenshots.
- Generated artifact cannot run live.
- Raw PII is displayed despite mask policy.

---

## 12. Orchestration Execution Plan

Use the `orchestrate-worktrees` workflow for implementation. The master session owns architecture, merge order, integration, and final verification. Worker sessions own isolated lanes.

### Checkpoint 0 - Repo Foundation And Contracts

**User-facing outcome:** repository becomes runnable and understandable; all lanes share contracts.

Lanes:

1. **Contracts / Docs Lane**
   - Owns: `README.md`, `docs/**`, `packages/shared-contracts/**`, `uipath/**`.
   - Produces: shared TypeScript types, schema docs, UiPath setup docs, agent prompt drafts.

2. **Scaffold Lane**
   - Owns: root package/workspace config, `apps/factory-console`, `services/factory-api`, `services/build-worker`, `apps/generated-customer360-template`.
   - Produces: monorepo skeleton, scripts, basic dev commands.

3. **QA Baseline Lane**
   - Owns: test runner config, lint/build scripts, `scripts/smoke-demo.ts`.
   - Produces: baseline checks and CI-ready commands.

Merge order:

1. Scaffold.
2. Contracts/docs.
3. QA baseline.
4. Master integration patch.

Verification:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

If not all packages exist yet, use package-specific checks and document gaps.

### Checkpoint 1 - Factory Console + Factory API Live Product Spine

**User-facing outcome:** user can submit a request, answer clarifications, see governance, manifest, and timeline in a polished console using local storage/API.

Lanes:

1. **Factory API Lane**
   - Owns: `services/factory-api/**`, shared API contracts.
   - Implements request/spec/governance/manifest/timeline endpoints.
   - Uses local store adapter shaped for Data Service.

2. **Factory Console UX Lane**
   - Owns: `apps/factory-console/**`.
   - Implements intake, clarification, governance, manifest, timeline, quality gate placeholder.
   - Must be beautiful, responsive, enterprise-focused.

3. **UiPath Docs/Config Lane**
   - Owns: `uipath/**`, `docs/uipath-setup.md`, `docs/maestro-bpmn.md`, `docs/action-center-approvals.md`.
   - Defines exact UiPath setup and BPMN mapping from the implemented API state machine.

Merge order:

1. Factory API.
2. Factory Console.
3. UiPath docs/config.
4. Integration wiring.

Verification:

```bash
npm run dev:api
npm run dev:factory-console
npm run test --workspace services/factory-api
npm run test --workspace apps/factory-console
npm run build --workspace apps/factory-console
```

Manual smoke:

- submit request;
- answer clarifications;
- create governance result;
- create manifest;
- inspect audit timeline.

### Checkpoint 2 - Customer360 Template + Metrics + Tests

**User-facing outcome:** a high-quality Customer360 dashboard template runs with synthetic data and robust tests before Codex modifies it.

Lanes:

1. **Metrics/Data Lane**
   - Owns: `packages/customer360-metrics/**`, template data files, metric tests.
   - Implements schema validation, metric calculations, PII masking helpers, mutation helper.

2. **Customer360 UX Lane**
   - Owns: `apps/generated-customer360-template/**` UI.
   - Builds dashboard with KPI cards, charts, segment table, retention/proxy, freshness, refresh.

3. **Template QA Lane**
   - Owns: template tests, smoke tests, empty-state tests, Playwright if used.
   - Ensures mutation changes output.

Merge order:

1. Metrics/data.
2. Customer360 UX.
3. Template QA.
4. Integration patch.

Verification:

```bash
npm run test --workspace packages/customer360-metrics
npm run test --workspace apps/generated-customer360-template
npm run build --workspace apps/generated-customer360-template
npm run smoke:customer360
```

Manual smoke:

- open dashboard;
- verify masked PII;
- mutate data;
- refresh;
- observe KPI change.

### Checkpoint 3 - Build Worker + Codex + GitHub Diff/PR

**User-facing outcome:** approved manifest triggers a real worker that creates isolated workspace, runs Codex, generates/modifies files, runs tests, and returns branch/diff/PR evidence.

Lanes:

1. **Build Worker Core Lane**
   - Owns: `services/build-worker/**`.
   - Implements `/build`, `/build/:id`, manifest validation, workspace management, status events.

2. **Codex Runner Lane**
   - Owns: `services/build-worker/src/codex/**`, `services/build-worker/prompts/**`.
   - Implements Codex command construction, JSONL capture, bounded repair attempt.
   - Ensures `workspace-write` and no secret leakage.

3. **GitHub/Artifact Lane**
   - Owns: build-worker Git integration, PR/diff reporting, artifact list.
   - Implements branch creation and PR when token exists; local diff fallback.

4. **Worker QA/Security Lane**
   - Owns: worker tests, guardrail scans, no-raw-PII scan, no-secret scan.

Merge order:

1. Build Worker Core.
2. Codex Runner.
3. Worker QA/Security.
4. GitHub/Artifact.
5. Master integration with Factory API/Console.

Verification:

```bash
npm run test --workspace services/build-worker
npm run build --workspace services/build-worker
npm run smoke:build-worker
codex exec --sandbox workspace-write --json --skip-git-repo-check "Return only a short readiness check."
```

Manual smoke:

- trigger build from manifest;
- inspect worker logs;
- see generated files;
- see tests;
- see branch/diff/PR URL or fallback.

### Checkpoint 4 - UiPath Platform Integration

**User-facing outcome:** UiPath is visibly and functionally orchestrating the product, not just referenced.

Lanes:

1. **Maestro/Data Service Lane**
   - Owns: `uipath/maestro/**`, `uipath/data-service/**`, setup docs.
   - Builds/imports Data Service schema.
   - Builds Maestro BPMN with status mapping.

2. **Apps/Action Center Lane**
   - Owns: `uipath/action-center/**`, UiPath Apps notes/assets/screens.
   - Creates UiPath Apps intake/status companion.
   - Creates approval task contracts.

3. **Agents/API Workflow Lane**
   - Owns: `uipath/agents/**`, API Workflow contracts, integration docs.
   - Implements or documents Requirements/Governance/Planner agents and API workflow calls.

4. **Test Cloud Lane**
   - Owns: `uipath/test-cloud/**`, quality-gate integration.
   - Adds live Test Cloud/Test Manager integration if available; otherwise Test Cloud-ready setup and clear fallback.

Merge order:

1. Maestro/Data Service.
2. Agents/API Workflow.
3. Apps/Action Center.
4. Test Cloud.
5. Master integration and screenshots/docs.

Verification:

```bash
uip --version
uip skills install --agent codex --local
uip login status
```

Platform manual smoke:

- show Data Service records;
- show Maestro process instance;
- show Action Center approval;
- show API Workflow/worker call;
- show Test Cloud/Test Manager or documented fallback;
- show Factory Console reflects platform state.

### Checkpoint 5 - Deployment, Demo Polish, Submission Package

**User-facing outcome:** production-ready hackathon package with working demo flow, deployment URL, README, deck/demo script, reset script, screenshots.

Lanes:

1. **Deployment Lane**
   - Owns: Vercel/sandbox deploy config, generated artifact deployment, env docs.

2. **Demo UX Polish Lane**
   - Owns: final Factory Console polish, generated dashboard polish, loading/error states.

3. **Submission Docs Lane**
   - Owns: `README.md`, `docs/demo-script.md`, `docs/uipath-setup.md`, Devpost copy, component list.

4. **Final QA Lane**
   - Owns: full smoke script, screenshot checklist, privacy/security scan, README verification.

Merge order:

1. Deployment.
2. Demo UX polish.
3. Submission docs.
4. Final QA.
5. Master final integration.

Verification:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run smoke:demo
git diff --check
```

Manual demo rehearsal:

- complete five-minute flow end to end twice;
- reset state;
- rerun with PII-blocking variant;
- rerun with data mutation refresh.

---

## 13. Worker Prompt Templates

Use these as starting points for orchestration sessions.

### Generic Worker Prompt

```text
You are the <checkpoint> <lane> implementation lane for Governed Agentic Automation Factory.

Read first:
- AGENTS.md if present
- governed_agentic_automation_factory_final_build_spec.md
- governed_agentic_automation_factory_implementation_plan.md
- any docs relevant to your lane

Goal:
<specific lane outcome>

Ownership:
- You may edit: <paths>
- Coordinate or avoid: <paths>
- Do not edit: unrelated lanes, generated runs, secrets, lockfiles unless required by your package install.

Implementation requirements:
- Preserve UiPath as the orchestration/governance layer.
- Keep Codex constrained by manifest and workspace-write sandbox.
- Use live behavior or honest unavailable states.
- No raw PII display.
- No secrets in source, manifests, logs, or docs.

Verification:
- Run <commands>.
- If a command cannot run, explain why and run the closest safe check.

Handoff:
Report changed files, summary, commands run, pass/fail, risks, env notes, contract changes, and integration instructions.
```

### Checkpoint 1 Factory API Lane Prompt

```text
Goal:
Implement the local Factory API spine for requests, clarifications, governance, manifests, and audit timeline.

Ownership:
- services/factory-api/**
- packages/shared-contracts/** only if needed for API types

Requirements:
- Provide endpoints listed in the implementation plan.
- Store local data in a simple adapter that can later map to UiPath Data Service.
- Emit audit events for every state transition.
- Include deterministic stub agents for requirements/governance until live UiPath Agents are wired.
- Use honest `platformMode` fields.

Verification:
- npm run test --workspace services/factory-api
- npm run build --workspace services/factory-api
```

### Checkpoint 3 Codex Runner Lane Prompt

```text
Goal:
Implement Codex invocation inside the Build Worker.

Ownership:
- services/build-worker/src/codex/**
- services/build-worker/prompts/**
- tests directly covering this runner

Requirements:
- Construct `codex exec --sandbox workspace-write --json --skip-git-repo-check`.
- Write build_manifest.json and AGENTS.md into the isolated workspace.
- Capture JSONL events to logs.
- Enforce max_repair_attempts.
- Do not allow production deploy, secret access, raw PII logging, or file writes outside workspace.

Verification:
- npm run test --workspace services/build-worker
- run a dry command that does not mutate project state where possible.
```

---

## 14. Demo Script Mapping

Five-minute flow:

1. **0:00-0:25 Problem**
   - Coding agents are fast but ungoverned.
   - UiPath becomes the enterprise control plane.

2. **0:25-0:55 Intake**
   - Submit request in Factory Console.
   - Show mirrored UiPath Apps/Data Service request if live.

3. **0:55-1:35 Clarification + Governance**
   - Requirements Agent asks focused questions.
   - Governance Agent masks PII and sets approvals.
   - Show Maestro status.

4. **1:35-2:05 Human Approval**
   - Show Action Center task.
   - Approve scope/data policy.

5. **2:05-3:05 Codex Build**
   - Show manifest.
   - Trigger Build Worker from Maestro/API Workflow.
   - Show Codex logs, generated files, branch/PR/diff.

6. **3:05-3:45 Quality Gate**
   - Show metric tests, PII scan, schema validation, smoke test.
   - Show Test Cloud/Test Manager panel if live.

7. **3:45-4:25 Release + Deployment**
   - Release approval.
   - Deploy sandbox dashboard.
   - Open generated Customer360 dashboard.

8. **4:25-4:50 Live Refresh Proof**
   - Mutate sample data.
   - Refresh dashboard.
   - Show KPI change and freshness timestamp.

9. **4:50-5:00 Close**
   - Show audit trail.
   - State UiPath components used and why the architecture scales.

---

## 15. Risks And Fallbacks

| Risk | Mitigation |
|---|---|
| UiPath Labs access delayed | Build full local spine with Data Service-shaped adapters and clear setup docs; prioritize screenshots/live setup once access arrives. |
| `uip` install/auth fails | Diagnose install/registration first. Keep Codex worker live and document UiPath CLI activation gap. |
| Test Cloud API takes too long | Run local/CI tests as hard gate; show Test Cloud-ready docs or manual Test Manager evidence. |
| GitHub PR automation fails | Create branch/diff locally and expose diff artifact; keep PR as enhancement. |
| Vercel deployment fails | Run sandbox server locally and record app URL; deploy static build as fallback. |
| Codex generation is slow/unpredictable | Use a strong template and constrained manifest; allow one repair attempt; keep demo seed request bounded. |
| UI feels too demo-like | Make Factory Console stateful with real timeline, logs, generated file list, links, empty/error states. |
| UiPath feels bolted on | Maestro owns the lifecycle, Action Center gates approvals, Data Service stores state, API Workflow triggers worker, and Factory Console mirrors platform status. |

---

## 16. Definition Of Done

The submission is ready when:

- Public GitHub repo exists with MIT or Apache 2.0 license.
- README explains product, setup, UiPath components, agent types, coding-agent use, and run commands.
- Factory Console runs locally or deployed.
- Build Worker runs Codex and generates/modifies real files.
- Customer360 dashboard deploys/runs.
- Tests and PII scan pass.
- Approval gates are visible.
- Audit trail is visible.
- UiPath platform components are live where access permits and documented where setup is manual.
- Demo video under five minutes shows the solution running, architecture, agents, orchestration, and humans-in-the-loop.
- Presentation deck link is ready.

---

## 17. Source References

- https://uipath-agenthack.devpost.com/
- https://uipath-agenthack.devpost.com/rules
- https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/bpmn
- https://docs.uipath.com/apps/automation-cloud/latest/user-guide/introduction
- https://docs.uipath.com/apps/automation-cloud/latest/user-guide/rule-start-process
- https://docs.uipath.com/action-center/automation-cloud/latest/user-guide/about-actions
- https://docs.uipath.com/agents/automation-cloud/latest/user-guide/about-uipath-agents
- https://docs.uipath.com/agents/automation-cloud/latest/user-guide/api-workflows
- https://docs.uipath.com/agents/automation-cloud/latest/user-guide/guardrails
- https://docs.uipath.com/data-service/automation-cloud/latest/user-guide/introduction
- https://docs.uipath.com/test-cloud/automation-cloud/latest/admin-guide/about-test-cloud
- https://docs.uipath.com/uipath-cli/standalone/latest/user-guide/coding-agents
- https://docs.uipath.com/uipath-cli/standalone/latest/user-guide/uip-skills
