You are the Checkpoint 3 Build Worker Core And API implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Other workers are editing other lanes in parallel, so do not revert unrelated changes and keep edits inside your ownership boundaries.

Read first:
- `AGENTS.md`
- `docs/orchestration/checkpoint-3/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/api-workflow-contract.md`
- `packages/shared-contracts/src/index.ts`
- `services/build-worker/src/index.ts`
- `services/build-worker/src/server.ts`

Base state: `main` at `9a8a332`.

Goal:
Implement the core Build Worker HTTP/runtime spine so an approved Customer360 build manifest can be queued, validated, tracked, and executed through dependency-injected runner hooks. The lane should make the worker real enough for Codex/Git lanes to plug in without relying on a fake final state.

Ownership:
- You may edit `services/build-worker/src/index.ts`, `services/build-worker/src/server.ts`, `services/build-worker/src/store.ts`, `services/build-worker/src/manifest.ts`, `services/build-worker/src/workspace.ts`, and related core modules under `services/build-worker/src/**` except `src/codex/**`, `src/git/**`, `src/artifacts/**`, `src/github/**`.
- You may add focused core tests under `services/build-worker/test/**` only if needed, but leave broad QA ownership to the QA lane.
- Avoid root `package.json`, app code, UiPath docs, generated `dist/**`, and `node_modules/**`.

Implementation requirements:
- Provide `GET /health`, `POST /build`, and `GET /build/:id`.
- Accept the existing worker-facing `BuildManifest` and/or a safe projection from `FactoryBuildManifest`.
- Validate template allowlist: Customer360 only.
- Validate output/file boundaries: sandbox-only, allowed files, no absolute paths, no parent traversal, no `node_modules`, no `dist`, no `.env`, no `.uipath/.skills`, no `.agents/skills`.
- Create an in-memory run store with deterministic statuses, timestamps, audit/event entries, run ids, and failure reasons.
- Create a workspace plan rooted in a temp/workspace directory without using destructive git commands.
- Use dependency injection for the actual Codex and Git/artifact runner so this lane can test without invoking Codex.
- Keep live-platform claims honest: local-simulated/uipath-ready only.

Verification:
- Run `npm --workspace @agent-factory/build-worker test`.
- Run `npm --workspace @agent-factory/build-worker run build`.
- Run `git diff --check`.
- If a command cannot run, explain why and run the closest safe check.

Handoff:
Commit your lane changes locally. Report changed files, commit id, endpoint/API shape, exported core types, commands run/results, risks, and integration notes for Codex/Git/QA lanes.
