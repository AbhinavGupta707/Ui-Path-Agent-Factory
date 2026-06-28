You are the Checkpoint 2 Customer360 UX implementation lane for the Governed Agentic Automation Factory.

Read `AGENTS.md` and these project docs first:

- `docs/orchestration/checkpoint-2/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `README.md`

Base state: `main` at `7c913c3ab4f49a2ad6d2844030c0b765d2f199e5`, or the newer checkpoint setup commit if present in your worktree.

Goal:

Make `apps/customer360-template` feel like a real generated business dashboard artifact: polished, data-dense, responsive, and ready for a demo where Codex later modifies it. It should clearly show masked Customer360 analytics, not a placeholder table.

Ownership:

- You may edit: `apps/customer360-template/src/**`, `apps/customer360-template/index.html`.
- Avoid unless the orchestrator has already merged Metrics And Data: `packages/customer360-metrics/**`.
- Do not edit: `apps/customer360-template/test/**`, `services/**`, `uipath/**`, root `package.json`, `dist/**`, `node_modules/**`, `.agents/**`, `.uipath/**`.

Implementation requirements:

- Build the actual usable dashboard as the first screen, not a landing page.
- Include KPI cards, time-series/chart-like revenue visualization, segment revenue, retention/cohort or retention-proxy panel, churn-risk/opportunity table, behavior funnel summary, data freshness, and PII masking indicator.
- Use the metric package APIs available in your worktree. If the Metrics And Data lane has not landed yet, keep integration thin and compatible with likely exports.
- Add graceful empty/loading/degraded states without relying on network.
- Keep the design enterprise-focused: dense, polished, scannable, no marketing hero, no nested cards.
- Ensure responsive layout and stable dimensions. Text must not overlap or overflow on mobile or desktop.
- Use CSS/HTML/SVG or simple div-based visualizations as appropriate; do not add heavy chart libraries unless clearly justified.
- Do not expose raw emails, phone numbers, or full personal names in the UI.

Verification:

- Run `npm --workspace @agent-factory/customer360-template run typecheck`.
- Run `npm --workspace @agent-factory/customer360-template run build`.
- If feasible, run a local visual smoke and note any limitations.
- If commands cannot run, explain why and run the closest safe check.

Handoff:

Report files changed, UI sections implemented, commands run, tests/build passing or failing, responsive/manual smoke notes, risks, and any assumptions about metric APIs that the orchestrator may need to reconcile.
