# Customer360 Template Runbook

The Customer360 template is the local-simulated dashboard artifact used by the governed build factory. It is test-ready for Checkpoint 2 and intentionally does not claim live UiPath deployment, production data access, or `uipath-live` platform execution.

## Run Locally

Install dependencies from the repo root:

```bash
npm install
```

Start the dashboard:

```bash
npm --workspace @agent-factory/customer360-template run dev
```

The dev server uses Vite on port `5174`. The app is also available through the root helper:

```bash
npm run dev:customer360
```

## Repeatable Checks

Run the template checks directly:

```bash
npm --workspace @agent-factory/customer360-template run typecheck
npm --workspace @agent-factory/customer360-template run build
npm --workspace @agent-factory/customer360-template run test
```

Run the checkpoint-oriented smoke command:

```bash
npm run smoke:customer360
```

The template package prebuilds `@agent-factory/customer360-metrics` before typecheck, build, and test so these commands work from a fresh install without manually building the metrics workspace first.

## Synthetic Data

Current seed data lives in `packages/customer360-metrics/src/index.ts` and is imported by the dashboard through the `@agent-factory/customer360-metrics` workspace package. The metric layer exposes typed `Customer360Dataset` records for customers, orders, behavior events, returns, refresh metadata, masking, validation, and aggregate metrics.

The repo also ships repeatable synthetic JSON snapshots in `apps/customer360-template/public/data/customer360-baseline.json` and `apps/customer360-template/public/data/customer360-growth.json`. Those files are safe demo artifacts, not real customer data. The dashboard currently uses package exports for local-first rendering so it does not require a network call.

## PII Masking Expectations

The synthetic dataset includes person, email, and phone-shaped fields so the masking contract can be tested. The rendered dashboard must use the metric package's masked labels and must not display raw emails, phone numbers, or full person names.

The app-level Vitest suite renders the React surface with `react-dom/server`, asserts that no raw contact data appears, and uses `containsRawCustomerPii` from the metrics package as a guardrail.

For Checkpoint 3 and later Codex modifications:

- Keep `pii_policy: "mask_email_name_phone"` as the default posture.
- Use masking helpers from `@agent-factory/customer360-metrics` when person, email, or phone fields are added.
- Do not log raw PII in tests, generated output, docs, manifests, or build logs.
- Treat company/account labels as displayable synthetic labels unless a future governance policy says otherwise.

## Refresh And Mutation Verification

The dashboard has baseline, degraded-feed, and empty-dataset modes. The refresh button deterministically mutates the local synthetic dataset through `mutateCustomer360Dataset`, recalculates metrics, and updates freshness metadata without any external fetch.

The automated template test uses `datasetForMode("ready", 1, ...)` plus `mutateCustomer360Dataset` to prove that revenue, order count, and freshness change from the baseline seed.

Manual smoke for the current local template:

1. Run `npm run smoke:customer360`.
2. Start the dashboard with `npm run dev:customer360`.
3. Confirm the KPI strip, revenue trend, segment panel, retention grid, funnel, category mix, and churn-risk table render.
4. Change a synthetic seed value in the metrics workspace or run `node scripts/mutate-customer360-data.mjs --seed 4242 --out apps/customer360-template/public/data/customer360-current.json`.
5. Re-run `npm run smoke:customer360`.
6. Refresh the local dashboard and confirm at least one KPI changes.

## Safe Checkpoint 3 Modification Boundaries

The Codex build worker may safely modify the Customer360 artifact when the approved manifest allows it, but it should preserve these boundaries:

- Allowed template surfaces: dashboard UI, synthetic data adapters, local tests, docs, and deployment metadata named by the manifest.
- Keep the existing `test` and `smoke` scripts runnable through npm workspaces.
- Keep app tests covering smoke render, empty or missing data fallback, PII masking expectations, and mutation-sensitive output.
- Keep all data local-simulated unless the manifest and UiPath approval path explicitly authorize a live connector.
- Do not add production deployment, external network access, secret reads, real customer data, or raw PII display.

The orchestrator should still run the full checkpoint verification after merging the metrics, UX, and QA lanes.
