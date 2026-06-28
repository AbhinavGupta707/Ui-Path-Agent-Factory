You are the Checkpoint 2 Metrics And Data implementation lane for the Governed Agentic Automation Factory.

Read `AGENTS.md` and these project docs first:

- `docs/orchestration/checkpoint-2/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `README.md`

Base state: `main` at `7c913c3ab4f49a2ad6d2844030c0b765d2f199e5`, or the newer checkpoint setup commit if present in your worktree.

Goal:

Turn the Customer360 metric/data layer into a robust synthetic analytics foundation that the dashboard and future Codex build worker can trust. The data should cover customers, orders, events, and returns; metric functions should support the required dashboard views and guardrails.

Ownership:

- You may edit: `packages/customer360-metrics/**`, `apps/customer360-template/public/data/**`, optional `scripts/mutate-customer360-data.*`.
- Avoid unless truly necessary: root `package.json`.
- Do not edit: `apps/customer360-template/src/**`, `apps/customer360-template/test/**`, `services/**`, `uipath/**`, `dist/**`, `node_modules/**`, `.agents/**`, `.uipath/**`.

Implementation requirements:

- Use synthetic data only.
- Add or evolve typed data models for customers, orders, events, returns, cohorts/segments, and refresh metadata.
- Implement metrics needed by the PRD: revenue, average order value, repeat purchase rate, purchase frequency, return rate, segment revenue, retention/cohort proxy, churn-risk proxy, top categories/opportunities, and behavior funnel summary.
- Add PII masking helpers. Renderable customer labels must avoid raw emails/phones/full names by default.
- Add validation helpers for schema-like checks and empty/missing data behavior.
- Add a deterministic mutation or alternate seed helper so QA can prove refresh changes output.
- Keep APIs easy for the UI lane to consume.
- Preserve existing exported names where practical, or provide compatibility wrappers.

Verification:

- Run `npm --workspace @agent-factory/customer360-metrics test`.
- Run `npm --workspace @agent-factory/customer360-metrics run build`.
- If commands cannot run, explain why and run the closest safe check.

Handoff:

Report files changed, exported APIs added/changed, commands run, tests passing/failing, risks, and integration notes for the Customer360 UX and Template QA lanes.
