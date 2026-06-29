# Checkpoint 6: Live Agentic Product

Goal: turn Checkpoint 5 from a local proof console into a live, premium-feeling agentic product flow.

## Product Outcome

- A judge-facing Factory Console that visually matches the premium dark enterprise references in `Ui References/`.
- A simple user flow: New Request -> Build Plan & Governance -> Live Run -> Output Preview.
- Fireworks-backed model profiles and LangSmith tracing available through server-side runtime code.
- Codex remains the heavy build agent: surrounding agents clarify, govern, plan, and validate before Codex edits the repo.
- UiPath remains the enterprise orchestration layer: Maestro, Action Center, Data Service, API Workflows, Test Manager, and audit are represented honestly, with live mutations gated by explicit approval.

## Non-Goals

- No production deployment.
- No raw secrets in logs, UI, docs, git, or traces.
- No live UiPath mutations without explicit approval.
- No fake claims that import-ready UiPath assets are already running.
- No scratch worktree reuse from `/private/tmp/agent-factory-cp5`.

## Lanes

1. **Agent Runtime And Provider Wiring**
   - Build the server-side Fireworks/LangSmith agent runtime, typed model profiles, schema validation, and safe degraded states.
2. **Codex Build Worker Orchestration**
   - Wire the Build Worker toward a real Codex/Git execution path and expose safe status/evidence for the console.
3. **Premium Product UI**
   - Redesign Factory Console around the reference images and connect it to lifecycle state instead of static proof panels.
4. **Integration QA And Live Runbook**
   - Validate the full local lifecycle, provider checks, privacy/security, docs, and manual demo path.

## Merge Order

1. Agent Runtime And Provider Wiring
2. Codex Build Worker Orchestration
3. Premium Product UI
4. Integration QA And Live Runbook

## Verification Target

Run, at minimum:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

Use browser/Chrome verification for the final UI pass on laptop-oriented widths.
