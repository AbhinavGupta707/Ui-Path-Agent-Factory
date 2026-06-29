# Checkpoint 6 Live Demo Runbook

Last updated: 2026-06-29

This runbook is the judge-facing path for the Checkpoint 6 Agent Factory demo. It keeps the UI story simple while preserving the real architecture: UiPath governs the lifecycle, Fireworks powers server-side agent reasoning when configured, LangSmith observes traces when configured, and Codex performs constrained build work through the Build Worker contract.

## Demo Truth Table

| Layer | Demo status | What to say |
|---|---|---|
| Factory Console | Local runnable product UI | The console is the operator surface for request intake, plan review, live run progress, approvals, output preview, and evidence. |
| Factory API | Local runnable lifecycle API | The API owns local request state and exposes the same lifecycle states planned for Data Service. |
| Build Worker | Local runnable service contract | The worker validates manifests and records build evidence. It blocks honestly when no live Codex/Git runner is injected. |
| Customer360 dashboard | Local runnable generated target | The dashboard is the sandbox output with synthetic data, masked identifiers, refresh states, and quality checks. |
| Fireworks | Provider-ready through server-side config | Model profiles are configured outside the UI. Provider values must stay in local or deployment configuration, never in docs, screenshots, logs, or git. |
| LangSmith | Provider-ready through server-side config | Tracing is for observability and evaluation; it is not the product state store. Share trace links only after confirming they contain sanitized payloads. |
| UiPath Orchestrator | Live folder verified | The `AgentFactoryDemo` folder exists. Jobs, assets, processes, and runtime mutations still require explicit approval. |
| UiPath Test Manager/Test Cloud | Live catalog verified | Project `AFQG`, test set `AFQG:1`, and seven test cases exist. Live execution remains approval-gated. |
| Maestro, Agents, API Workflows | Import-ready or locally validated | They model the enterprise orchestration path but are not claimed as running until published, deployed, and executed with approval. |
| Data Service, Action Center, UiPath Apps | Proposal-only contracts | They explain the target enterprise state and approval surfaces. Do not claim live records, tasks, or app deployments. |

## Setup

Start from a clean dependency state:

```bash
npm install
npm run demo:scan
npm run smoke:demo
```

`npm run smoke:demo` is intentionally local and no-secret. It resets deterministic rehearsal state, runs the privacy/security scan, tests the Factory API lifecycle, runs the Build Worker smoke, builds and typechecks the Factory Console, and runs the Customer360 smoke.

For live-provider rehearsal, configure local values with:

```bash
npm run setup:live
```

The setup helper writes git-ignored local configuration and masks provider prompts. Keep screenshots cropped so provider values are never visible. Do not paste provider values into chat, docs, terminal transcripts, issue comments, or PR descriptions.

## Provider Validation

Use layer order when something appears missing:

1. Confirm the feature or script is registered in `package.json` or the relevant UiPath CLI surface.
2. Confirm the activation path was completed, such as `npm run setup:live`, `uip login status`, or approved UiPath import.
3. Confirm configuration is present in the local environment or deployment secret store.
4. Only then debug runtime permissions, callbacks, or API failures.

Safe local checks:

```bash
npm run demo:scan
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
```

Network provider probes for Fireworks or LangSmith can be run only by the owner of the configured environment. Record HTTP status, model profile names, project name, and trace URL, but never record provider values or full payloads that may include sensitive request text.

## Local Startup

Preferred Checkpoint 6 startup:

```bash
npm run dev:live
```

`dev:live` builds the shared packages and services, then starts:

| Surface | Default URL |
|---|---|
| Factory API | `http://localhost:8887` |
| Build Worker | `http://localhost:8890` |
| Factory Console | `http://localhost:5183` |
| Customer360 dashboard | `http://localhost:5184` |

If a lane is using the older Checkpoint 5 ports, the separate commands still work:

```bash
npm run dev:api
npm run dev:worker
npm run dev:console
npm run dev:customer360
```

Those commands usually expose `8787`, `8790`, `5173`, and `5174`. Use the URLs printed by the dev servers as the source of truth.

## Manual Product Workflow

Use this request:

```text
I am in a business and I am struggling to track customer analytics. I want a dashboard that collates customer insights from purchases, behaviours, segments, and historical customer activity.
```

Walk the demo in this order:

| Step | UI surface | Verification |
|---|---|---|
| New Request | Submit or show the Customer360 request. | The UI creates a visible request and does not expose endpoint jargon as the main story. |
| Clarification | Answer focused questions about sources, metrics, PII masking, filters, and approval owner. | Questions are bounded to Customer360 and avoid invented connectors. |
| Build Plan & Governance | Review template, approved sources, metrics, output artifacts, risk, and required approvals. | Governance requires masking and blocks production deployment, secret access, and destructive changes. |
| Scope Approval | Approve the local scope/data decision. | Label as local/proposal-backed unless a live Action Center task exists. |
| Live Run | Watch progress through manifest, build worker, test, release, deployment, and audit states. | The run should show real timestamps or clear local state, with technical evidence tucked into details. |
| Output Preview | Open Customer360 from the run output. | Dashboard renders synthetic metrics, masked identifiers, refresh/degraded/empty states, and sandbox labeling. |
| Evidence | Open audit, quality, and platform evidence. | Claims match the truth table and never imply live UiPath execution where none occurred. |

## Architecture Talk Track

Keep the UI narration business-friendly:

- "The user asks for a dashboard; the factory turns that into a governed build request."
- "UiPath is the enterprise control plane: orchestration, approvals, state, API workflows, Test Manager, and audit."
- "Fireworks provides model profiles for classification, requirements, governance, planning, and repair analysis in the server-side runtime."
- "LangSmith gives traceability across graph nodes, model calls, retries, and evaluations. It is evidence and observability, not a user-facing database."
- "Codex is the constrained builder. It receives a manifest with allowed files, forbidden actions, sandbox-only deployment, test expectations, and repair limits."
- "The clean UI hides most of that machinery, but the evidence drawer and docs expose it for technical judges."

## Demo Video Narration Notes

| Segment | On screen | Narration cue |
|---|---|---|
| Opening | Factory Console new request | "This is not a prompt box that lets anyone generate anything. It is a governed app factory for a specific approved template." |
| Clarify | Questions and answers | "The agent path collects only the missing facts needed to build safely: sources, metrics, filters, masking, and ownership." |
| Govern | Risk and approval summary | "The governance layer blocks raw identifier exposure, production deployment, broad file changes, and unavailable connector assumptions." |
| Plan | Manifest or build plan | "The builder gets a narrow manifest, not a vague instruction. That is how Codex stays useful without becoming unbounded." |
| Run | Timeline and progress | "Behind the simple progress rail, UiPath coordinates human decisions, API workflow calls, test evidence, and audit state." |
| Output | Customer360 dashboard | "The generated target is a real local dashboard with synthetic data, deterministic refresh, and quality tests. It is sandbox evidence, not a production release." |
| Close | Evidence and component map | "The honest boundary is the point: some assets are live, some are local, some are import-ready, and mutations wait for approval." |

## No-Secret Validation Guidance

Before recording or handoff:

```bash
npm run demo:scan
git diff --check
```

Recommended if the other lanes have landed cleanly:

```bash
npm run smoke:demo
```

Manual checks:

- Terminal output should not show provider values, customer identifiers, browser storage, or local configuration contents.
- Screenshots should crop any setup prompts, provider dashboards, trace payloads, or environment panels.
- LangSmith traces should be reviewed for sanitized inputs before a link is shared.
- UiPath CLI output can show folder, project, test set, and test case metadata, but not credentials or tenant-private payloads beyond approved evidence.
- Build Worker logs should show redacted evidence and allowed-file results only.

## Approval-Gated Actions

Do not perform these during this lane without explicit approval for the exact action:

- Data Service choice-set, entity, or record creation.
- Maestro publish, deploy, or run.
- Agent upload, publish, deploy, or run.
- API Workflow upload or runtime calls.
- Action Center task creation, completion, cancellation, or assignment.
- UiPath Apps publish or deploy.
- Live Test Manager/Test Cloud execution.
- Production deployment, or any command that enables it, requires explicit approval and is outside this lane.

## Handoff Checklist

- `docs/live-demo-runbook.md` reflects the current UI and architecture.
- `docs/component-map.md` separates live, local, import-ready, proposal-only, and approval-gated states.
- `docs/orchestration/checkpoint-6/status.md` lists final QA state and residual manual checks.
- `npm run demo:scan` passed.
- `git diff --check` passed.
- `npm run smoke:demo` passed or is explicitly deferred with the reason.
- Any claim that uses "live" names the concrete live asset or states the approval boundary.
