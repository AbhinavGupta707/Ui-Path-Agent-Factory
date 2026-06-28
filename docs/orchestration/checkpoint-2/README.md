# Checkpoint 2 - Customer360 Template, Metrics, And Tests

## Outcome

Build the Customer360 proof artifact into a high-quality, testable dashboard template before the Codex build worker starts modifying it in Checkpoint 3. A reviewer should be able to run the template locally, see masked synthetic customer analytics, trust the metrics, and verify that changing seeded data changes the rendered business output.

This checkpoint is still local-first. It strengthens the generated artifact path and keeps UiPath positioned as the governing orchestration layer, but it does not create live Maestro, Data Service, Action Center, API Workflow, Test Manager, or deployment assets.

## Base

- Integration branch: `main`
- Initial orchestration base: `7c913c3ab4f49a2ad6d2844030c0b765d2f199e5`
- Repo: `AbhinavGupta707/Ui-Path-Agent-Factory`

## Lanes

### Lane 1 - Metrics And Data

- Prompt: [metrics-data.md](../worker-prompts/checkpoint-2-metrics-data.md)
- Owns: `packages/customer360-metrics/**`, `apps/customer360-template/public/data/**`, optional `scripts/mutate-customer360-data.*`.
- Produces: validated synthetic Customer360 datasets, metric calculations, PII masking helpers, refresh/mutation support, and focused metric tests.

### Lane 2 - Customer360 UX

- Prompt: [customer360-ux.md](../worker-prompts/checkpoint-2-customer360-ux.md)
- Owns: `apps/customer360-template/src/**`, `apps/customer360-template/index.html`.
- Produces: polished dashboard UI with KPI cards, chart-like visualizations, segment/retention/risk views, freshness, masked PII status, empty/loading/degraded states, and responsive styling.

### Lane 3 - Template QA And Docs

- Prompt: [template-qa.md](../worker-prompts/checkpoint-2-template-qa.md)
- Owns: `apps/customer360-template/test/**`, `apps/customer360-template/package.json`, `docs/customer360-template.md`, and root `package.json` scripts only if needed for `smoke:customer360`.
- Produces: app-level tests, smoke coverage, mutation/refresh verification, template runbook, and a repeatable checkpoint verification command.

## Merge Order

1. Metrics And Data
2. Customer360 UX
3. Template QA And Docs
4. Integration patch by orchestrator session

## Shared Rules

- Read `AGENTS.md`, this checkpoint doc, the final build spec, and the implementation plan before editing.
- Do not edit generated folders: `dist/`, `node_modules/`, `.agents/`, `.uipath/`.
- Do not write secrets, local `.env` values, or real customer data.
- Use synthetic data only.
- Keep PII masked by default in the rendered UI.
- Do not claim `uipath-live`; this checkpoint remains `local-simulated` / `uipath-ready`.
- Prefer stable tests over brittle visual snapshots.
- Keep the app operational without network access.

## Verification

Each lane runs its own narrow checks. The orchestrator runs final integration:

```bash
npm --workspace @agent-factory/customer360-metrics test
npm --workspace @agent-factory/customer360-metrics run build
npm --workspace @agent-factory/customer360-template run typecheck
npm --workspace @agent-factory/customer360-template run build
npm run smoke
npm audit --audit-level=moderate
git diff --check
```

If the QA lane adds `smoke:customer360`, the orchestrator also runs:

```bash
npm run smoke:customer360
```

## Manual Smoke After Merge

1. Start the Customer360 template locally.
2. Confirm the dashboard renders with masked customer/person data.
3. Confirm KPIs, segments, retention/risk, and freshness are visible.
4. Mutate or switch seeded synthetic data.
5. Refresh and confirm at least one KPI or insight changes.

## Non-Goals

- Real Codex invocation from the Build Worker. That is Checkpoint 3.
- GitHub branch/PR automation. That is Checkpoint 3.
- Live Maestro deployment and Data Service entity creation. That is Checkpoint 4.
- Vercel/sandbox public deployment. That is Checkpoint 5.
