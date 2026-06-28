You are the Checkpoint 2 Template QA And Docs implementation lane for the Governed Agentic Automation Factory.

Read `AGENTS.md` and these project docs first:

- `docs/orchestration/checkpoint-2/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `README.md`

Base state: `main` at `7c913c3ab4f49a2ad6d2844030c0b765d2f199e5`, or the newer checkpoint setup commit if present in your worktree.

Goal:

Add repeatable template-level verification and runbook documentation so the Customer360 dashboard can be trusted before the build worker and Codex modify it in Checkpoint 3.

Ownership:

- You may edit: `apps/customer360-template/test/**`, `apps/customer360-template/package.json`, `docs/customer360-template.md`.
- You may edit root `package.json` only to add a `smoke:customer360` script if needed.
- Avoid editing `apps/customer360-template/src/**` except for tiny testability hooks agreed by the existing UI structure.
- Do not edit: `packages/customer360-metrics/**`, `services/**`, `uipath/**`, `dist/**`, `node_modules/**`, `.agents/**`, `.uipath/**`.

Implementation requirements:

- Add tests for dashboard smoke behavior, empty/missing data behavior, masked PII expectations, and refresh/mutation proof where feasible.
- Prefer Vitest/unit/component-friendly checks available in the existing dependency set. Do not add heavyweight browser tooling unless needed and justified.
- If adding scripts, keep them npm-workspace friendly and consistent with root scripts.
- Create `docs/customer360-template.md` with how to run, what data is synthetic, what PII masking guarantees exist, how refresh/mutation is verified, and what Checkpoint 3 can safely modify.
- Keep all claims honest: this is local-simulated/test-ready, not deployed or uipath-live.

Verification:

- Run `npm --workspace @agent-factory/customer360-template run typecheck`.
- Run `npm --workspace @agent-factory/customer360-template run build`.
- Run the app/template test command you add.
- Run `git diff --check`.
- If commands cannot run, explain why and run the closest safe check.

Handoff:

Report files changed, scripts/tests added, commands run, pass/fail status, remaining manual smoke, and any integration notes for the orchestrator.
