You are the Checkpoint 5 Demo UX Polish implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Read and follow:
- AGENTS.md
- docs/orchestration/checkpoint-5/README.md
- docs/orchestration/checkpoint-5/status.md
- governed_agentic_automation_factory_final_build_spec.md
- governed_agentic_automation_factory_implementation_plan.md
- docs/customer360-template.md
- docs/uipath-setup.md

Base state: `main` at commit `9786622`.

## Goal

Make the demo surfaces feel polished, complete, and credible for a five-minute hackathon walkthrough. The UI should show the governed lifecycle clearly without pretending unavailable assets are live.

## Ownership

You may edit:
- `apps/factory-console/src/**`
- `apps/factory-console/index.html`
- `apps/factory-console/package.json` only for app-local scripts or metadata
- `apps/customer360-template/src/**`
- `apps/customer360-template/index.html`
- `apps/customer360-template/package.json` only for app-local scripts or metadata

Coordinate or avoid:
- Shared contracts and API routes: Deployment/Runtime owns backend contract changes.
- Root `package.json`: Final QA owns final demo scripts.
- README/demo docs: Submission Package owns them.

Do not edit:
- `dist/**`
- `node_modules/**`
- `.env`
- `.uipath/.skills/**`
- `.agents/skills/**`

## Implementation Requirements

- Factory Console should present a compelling lifecycle: intake, clarification, governance, scope approval, manifest, build worker, Test Manager quality gates, release approval, deployment, and audit.
- Show current platform state honestly: local simulation, UiPath-ready, live Test Manager catalog assets, and pending live Data Service/Maestro/Action Center deployment where applicable.
- Add deployment evidence and rollback notes UI if missing.
- Improve empty, loading, degraded API, and preview-deployed states.
- Keep SaaS/operator UX restrained, dense, and professional. Avoid marketing hero pages.
- Customer360 dashboard should remain data-rich, responsive, masked by default, and demo-friendly. It should clearly show refresh/mutation/freshness and quality evidence.
- No raw PII. No real customer data. No external network dependency in routine local render.

## Verification

Run:
- `npm --workspace @agent-factory/factory-console run typecheck`
- `npm --workspace @agent-factory/factory-console run build`
- `npm --workspace @agent-factory/customer360-template run typecheck`
- `npm --workspace @agent-factory/customer360-template run build`
- `npm --workspace @agent-factory/customer360-template test`
- `git diff --check`

If practical, run local browser verification with browser-use or Chrome and report screenshots/viewport notes. Do not block on browser tooling if local build checks catch the lane risk.

## Handoff

Commit your lane changes locally. Report files changed, UX improvements, responsive/browser checks, commands run, risks, and integration notes.
