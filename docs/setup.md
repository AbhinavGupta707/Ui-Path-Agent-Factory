# Setup

This guide gets a reviewer from a fresh clone to the local Checkpoint 5 demo. It also lists the safe UiPath read-only checks that prove the Automation Cloud context without mutating live assets.

## 1. Local Prerequisites

```bash
node --version
npm --version
codex --version
uip --version
gh --version
vercel --version
```

Expected working state:

- Node.js 22+
- npm 10+
- Codex CLI 0.142+
- UiPath CLI 1.195.x authenticated to `galacticus / DefaultTenant`
- GitHub CLI authenticated if PR creation is enabled
- Vercel CLI authenticated only when a deployment lane provides hosted sandbox commands

## 2. Install And Verify

```bash
npm install
npm run smoke
```

`npm run smoke` runs workspace builds and tests. It is the fastest single check for reviewers before opening the demo.

## 3. Run The Local Demo

Start each service in a separate terminal after `npm run smoke` or `npm run build`:

```bash
npm run dev:api
```

```bash
npm run dev:worker
```

```bash
npm run dev:console
```

```bash
npm run dev:customer360
```

Default endpoints:

| Surface | URL |
|---|---|
| Factory API health | `http://localhost:8787/health` |
| Build Worker health | `http://localhost:8790/health` |
| Factory Console | Vite output, usually `http://localhost:5173` |
| Customer360 dashboard | `http://localhost:5174` |

The Factory API uses an in-memory store. Restarting `npm run dev:api` resets local request state.

## 4. Optional API Rehearsal

The Factory Console is the primary demo surface, but the same lifecycle can be driven from the API:

```bash
curl -s http://localhost:8787/health
```

```bash
curl -s -X POST http://localhost:8787/api/requests \
  -H "content-type: application/json" \
  -d '{"requester_name":"Avery Morgan","requester_email":"avery@example.com","request_text":"I need a governed Customer360 analytics dashboard for revenue operations.","owner_name":"Revenue Ops","owner_email":"revops@example.com"}'
```

For a freshly restarted API, the first request id is `REQ-2026-001`:

```bash
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/clarify
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/answers \
  -H "content-type: application/json" \
  -d '{"answers":[{"question_id":"pii_policy","answer":"Mask names/emails/phones","answered_by":"Avery Morgan"},{"question_id":"approved_sources","answer":"synthetic_customers_csv, synthetic_orders_csv, synthetic_events_csv, synthetic_returns_csv","answered_by":"Avery Morgan"},{"question_id":"approved_metrics","answer":"revenue, average_order_value, repeat_purchase_rate, churn_risk_proxy","answered_by":"Avery Morgan"},{"question_id":"required_filters","answer":"date_range, channel, product_category, segment","answered_by":"Avery Morgan"},{"question_id":"approval_owner","answer":"Revenue Ops","answered_by":"Avery Morgan"}]}'
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/spec
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/govern
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/approve-scope \
  -H "content-type: application/json" \
  -d '{"comments":"Approved for sandbox build."}'
curl -s -X POST http://localhost:8787/api/requests/REQ-2026-001/manifest
curl -s -X POST http://localhost:8787/api/builds \
  -H "content-type: application/json" \
  -d '{"request_id":"REQ-2026-001","manifest_id":"MAN-REQ-2026-001","mode":"sandbox"}'
curl -s -X PATCH http://localhost:8787/api/builds/BUILD-REQ-2026-001-001/status \
  -H "content-type: application/json" \
  -d '{"status":"building","worker_id":"local-worker-1","generated_files_json":["src/main.tsx","tests/dashboard.test.tsx"]}'
curl -s http://localhost:8787/api/requests/REQ-2026-001/timeline
```

## 5. Customer360 Refresh Proof

The dashboard has built-in Baseline, Degraded, Empty, and Refresh controls. Automated checks also prove deterministic data mutation:

```bash
npm run smoke:customer360
```

The standalone mutation helper writes an untracked data file for evidence or future deployment lanes:

```bash
node scripts/mutate-customer360-data.mjs --seed 20260715
```

## 6. UiPath Read-Only Checks

Use CLI checks before browser automation:

```bash
uip login status --output json
uip or folders get AgentFactoryDemo --output json
uip tm project list --limit 5 --output json
uip tm testcases list --project-key AFQG --output json
uip tm testsets list --project-key AFQG --output json
uip tm testsets list-testcases --project-key AFQG --test-set-key AFQG:1 --output json
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

Optional local Codex skill setup:

```bash
uip skills install --agent codex --local
```

Generated skill bundles are intentionally ignored by git.

## 7. Approval Boundaries

These actions are live mutations or side-effecting runtime calls and require explicit approval:

- Data Service choice-set/entity/record creation
- Maestro publish or run
- Agent solution upload, publish, deploy, or run
- API Workflow upload or runtime calls
- Action Center task creation or completion
- UiPath Apps coded app publish or deploy
- Live Test Manager/Test Cloud execution
- Production deployment
