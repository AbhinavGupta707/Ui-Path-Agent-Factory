You are the Checkpoint 3 Worker QA, Security, And Docs implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Other workers are editing other lanes in parallel, so do not revert unrelated changes and keep edits inside your ownership boundaries.

Read first:
- `AGENTS.md`
- `docs/orchestration/checkpoint-3/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/customer360-template.md`
- `docs/api-workflow-contract.md`
- `services/build-worker/package.json`
- `services/build-worker/test/build-plan.test.ts`

Base state: `main` at `9a8a332`.

Goal:
Add repeatable QA and security coverage for the build worker and document how to run/demo it. This lane should make Checkpoint 3 trustworthy without requiring live GitHub or live Codex during ordinary tests.

Ownership:
- You may edit `services/build-worker/test/**`, `services/build-worker/package.json`, root `package.json` only for a `smoke:build-worker` script, and `docs/build-worker.md`.
- You may add small test fixtures under `services/build-worker/fixtures/**`.
- Avoid source edits except tiny testability hooks if unavoidable and clearly explained.
- Do not edit app source, UiPath platform docs, generated `dist/**`, `node_modules/**`, `.env`, `.uipath/.skills`, or `.agents/skills`.

Implementation requirements:
- Test manifest validation and Customer360 allowlist.
- Test file-boundary rejection for parent traversal, absolute paths, `.env`, `node_modules`, generated output, and disallowed templates.
- Test no-token GitHub/local fallback behavior where feasible.
- Test Codex command construction/redaction/repair behavior where feasible.
- Test status transitions through queued/building/tests/artifact/failure paths with injected fake runner(s).
- Add no-secret/no-raw-PII scans over worker logs/results.
- Add `npm run smoke:build-worker` at root if missing.
- Add `docs/build-worker.md` with local run commands, env vars, no-key behavior, GitHub/PR behavior, Codex readiness, and demo steps.

Verification:
- Run `npm --workspace @agent-factory/build-worker test`.
- Run `npm --workspace @agent-factory/build-worker run build`.
- Run `npm run smoke:build-worker` if added.
- Run `git diff --check`.
- If a command cannot run, explain why and run the closest safe check.

Handoff:
Commit your lane changes locally. Report changed files, commit id, scripts/tests added, commands run/results, remaining manual smoke, and integration notes for the orchestrator.
