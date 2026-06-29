# Final QA Checklist

Last updated: 2026-06-29

This checklist verifies the local, no-secret demo path for the Governed Agentic Automation Factory. It is intentionally scoped to localhost, synthetic data, sandbox deployment language, and manual approval gates.

## Automated Demo Smoke

Run from the repository root after dependencies are installed:

```bash
npm run demo:reset
npm run demo:scan
npm run smoke:demo
```

Expected behavior:

- `demo:reset` writes deterministic rehearsal state under the OS temp directory, not the repo.
- `demo:scan` reports privacy/security errors as failures and reports cross-lane copy warnings separately.
- `smoke:demo` runs reset, scan, Factory API lifecycle tests, build-worker smoke, Factory Console typecheck/build, and Customer360 smoke without requiring `.env`, UiPath credentials, browser storage, or a deployment token.

## Local Browser Setup

Use localhost unless a preview URL has already been created by the Deployment lane.

```bash
npm run dev:api
npm run dev:console
npm run dev:customer360
```

Default local targets:

| Surface | URL | Expected mode |
|---|---|---|
| Factory API | `http://localhost:8787` | Local API spine |
| Factory Console | `http://localhost:5173` | `local-simulated` unless API probe is online |
| Customer360 dashboard | `http://localhost:5174` | Synthetic, masked, local metrics |

## Factory Console Browser Checks

| Check | Desktop | Mobile |
|---|---|---|
| App loads with "Customer360 build control plane" visible | Passed in Chrome | Manual visual check required |
| UiPath stack shows Maestro, Agents, Action Center, Data Service, API Workflow, Orchestrator, Test Cloud | Passed in Chrome | Manual visual check required |
| API mode is honest: online when Factory API is running, degraded/local-simulated when it is not | Passed in Chrome | Manual visual check required |
| Submit intake captures or simulates request without credentials | Passed in Chrome | Manual visual check required |
| Approve button changes scope approval state | Passed in Chrome | Manual visual check required |
| Clarify, Spec, Manifest, and Audit tabs are accessible | Passed in Chrome | Manual visual check required |
| Manifest view shows `sandbox_only: true` and blocked actions | Passed in Chrome | Manual visual check required |
| Quality gate panel shows metric, PII, smoke, and Test Cloud-ready evidence | Passed in Chrome | Manual visual check required |
| No raw customer names, emails, or phone numbers appear in rendered UI | Passed in Chrome | Manual visual check required |
| Console logs contain no runtime errors during basic navigation | Passed in Chrome | Manual visual check required |

## Customer360 Browser Checks

| Check | Desktop | Mobile |
|---|---|---|
| App loads with "Customer360 Insight Dashboard" visible | Passed in Chrome | Manual visual check required |
| KPI strip, revenue trend, segment revenue, retention proxy, behaviour funnel, category mix, and risk table render | Passed in Chrome | Manual visual check required |
| Data protection rail shows PII masking enabled and synthetic row counts | Passed in Chrome | Manual visual check required |
| Refresh changes the timestamp and recalculates local synthetic metrics | Passed in Chrome | Manual visual check required |
| Degraded feed mode shows a partial-feed warning without crashing | Passed in Chrome | Manual visual check required |
| Empty dataset mode shows zeroed KPI state and restore action | Passed in Chrome | Manual visual check required |
| Rendered customer labels remain tokenized or masked | Passed in Chrome | Manual visual check required |
| No external network or secret prompt is required | Passed in Chrome | Manual visual check required |
| Console logs contain no runtime errors during basic navigation | Passed in Chrome | Manual visual check required |

## Latest Local UI Smoke Evidence

Run date: 2026-06-29.

Browser automation status: desktop Chrome pass complete. The browser-use Node REPL tool was available, but the in-app browser backend was not discoverable. The orchestrator used the Chrome extension instead. Mobile viewport checks remain manual because the attached Chrome page wrapper did not expose viewport resizing for existing tabs.

Automated localhost evidence:

| Target | Result | Evidence |
|---|---|---|
| Factory API `http://127.0.0.1:8787/health` | Passed | HTTP 200; `syntheticDataOnly: true`. |
| Factory Console `http://127.0.0.1:5173/` | Passed | HTTP 200 app shell; source-marker check found control-plane, UiPath stack, sandbox, quality, and Action Center markers. |
| Customer360 `http://127.0.0.1:5174/` | Passed | HTTP 200 app shell; source-marker check found dashboard, PII masking, retention, funnel, and risk-table markers. |
| Factory Console desktop Chrome flow | Passed | Deploy tab rendered deployment evidence, demo approval, rollback, preview URL, and sandbox-only state with no console warnings/errors. |
| Customer360 desktop Chrome flow | Passed | Refresh, degraded, empty, and baseline modes rendered with no console warnings/errors and no raw direct identifiers. |

## Privacy And Security Scan Coverage

The scanner checks demo-facing source and docs for:

- raw PII claims without an explicit mask, block, redaction, or test context;
- secret, token, credential, browser storage, or environment-file access claims without a guardrail context;
- production deployment claims without explicit approval or sandbox boundaries;
- customer display wording that does not make masking explicit;
- stale baseline copy that no longer reflects the governed CP5 implementation.

Strict mode should pass after the Checkpoint 5 integration fixes:

```bash
npm run demo:scan:strict
```

## Reset And Rehearsal Loop

1. Run `npm run demo:reset`.
2. Start the local services listed above.
3. Rehearse Factory Console request, clarification, approval, manifest, quality, deployment, and audit narrative.
4. Open Customer360 and capture baseline KPI values.
5. Click Refresh and confirm timestamp/KPI changes.
6. Switch to degraded and empty modes to prove safe fallback states.
7. Run `npm run smoke:demo` before recording or submitting.
