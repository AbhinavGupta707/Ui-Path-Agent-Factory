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

Current seed data lives in `packages/customer360-metrics/src/index.ts` and is imported by the dashboard through the `@agent-factory/customer360-metrics` workspace package. The current records are synthetic account-level examples with segment, region, ARR, health score, open risk count, and product usage.

This checkpoint does not use real customer data. Future metrics/data work may add `apps/customer360-template/public/data/**` CSV or JSON seed files, but those files must remain synthetic and must be safe to commit.

## PII Masking Expectations

The current template displays account names only. It does not include raw emails, phone numbers, or individual person-name fields in the seed record shape. The app-level Vitest suite imports the rendered React tree and asserts that no email-like or phone-like raw contact data appears.

For Checkpoint 3 and later Codex modifications:

- Keep `pii_policy: "mask_email_name_phone"` as the default posture.
- Use masking helpers from `@agent-factory/customer360-metrics` when person, email, or phone fields are added.
- Do not log raw PII in tests, generated output, docs, manifests, or build logs.
- Treat company/account labels as displayable synthetic labels unless a future governance policy says otherwise.

## Refresh And Mutation Verification

The automated template test mutates a copy of the seeded records and verifies that ARR, average health, risk count, and expansion candidate output change. That proves the dashboard's business output is data-dependent before the build worker begins modifying the artifact.

Manual smoke for the current local template:

1. Run `npm run smoke:customer360`.
2. Start the dashboard with `npm run dev:customer360`.
3. Confirm the KPI strip and account table render.
4. Change a synthetic seed value in the metrics workspace or, after the data lane lands, in the approved `public/data` seed files.
5. Re-run `npm run smoke:customer360`.
6. Refresh the local dashboard and confirm at least one KPI changes.

If a later UX lane adds an in-app refresh button, use that button for step 6 and keep the smoke test focused on deterministic mutation proof.

## Safe Checkpoint 3 Modification Boundaries

The Codex build worker may safely modify the Customer360 artifact when the approved manifest allows it, but it should preserve these boundaries:

- Allowed template surfaces: dashboard UI, synthetic data adapters, local tests, docs, and deployment metadata named by the manifest.
- Keep the existing `test` and `smoke` scripts runnable through npm workspaces.
- Keep app tests covering smoke render, empty or missing data fallback, PII masking expectations, and mutation-sensitive output.
- Keep all data local-simulated unless the manifest and UiPath approval path explicitly authorize a live connector.
- Do not add production deployment, external network access, secret reads, real customer data, or raw PII display.

The orchestrator should still run the full checkpoint verification after merging the metrics, UX, and QA lanes.
