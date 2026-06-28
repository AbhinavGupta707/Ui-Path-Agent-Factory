You are the Checkpoint 3 Git Evidence And Artifacts implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Other workers are editing other lanes in parallel, so do not revert unrelated changes and keep edits inside your ownership boundaries.

Read first:
- `AGENTS.md`
- `docs/orchestration/checkpoint-3/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/api-workflow-contract.md`
- `docs/action-center-approvals.md`
- `services/build-worker/src/index.ts`

Base state: `main` at `9a8a332`.

Goal:
Implement the evidence layer that turns a completed worker run into branch, diff, artifact, and optional GitHub PR evidence. It must be useful in a live demo whether or not GitHub credentials are present.

Ownership:
- You may edit `services/build-worker/src/git/**`, `services/build-worker/src/artifacts/**`, and `services/build-worker/src/github/**`.
- You may update `services/build-worker/src/index.ts` only to export types/helpers needed by these modules.
- Do not edit `services/build-worker/src/server.ts`, `src/store.ts`, `src/codex/**`, prompt templates, root package files, app code, generated `dist/**`, or `node_modules/**`.

Implementation requirements:
- Provide helpers to compute changed files, diff stat, safe artifact list, branch name, and commit sha from a workspace.
- Do not use destructive commands such as `git reset --hard`, `git checkout --`, or broad cleanup.
- Exclude generated output, `node_modules`, `.env`, credentials, `.uipath/.skills`, `.agents/skills`, and local logs from artifact lists.
- Support local fallback when `GITHUB_PAT_TOKEN` is not present: return branch/diff/commit evidence and `githubMode: "local-fallback"`.
- Support optional GitHub PR creation when token/remote are present, but isolate network behavior behind an injectable client/interface so tests do not need GitHub.
- Keep the result honest: no fake PR URL.
- Include release-approval-friendly fields for Action Center later: checks, artifacts, branch, PR/local fallback, rollback notes.

Verification:
- Run `npm --workspace @agent-factory/build-worker test`.
- Run `npm --workspace @agent-factory/build-worker run build`.
- Run `git diff --check`.
- If a command cannot run, explain why and run the closest safe check.

Handoff:
Commit your lane changes locally. Report changed files, commit id, artifact/result API, no-token behavior, commands run/results, risks, and integration notes.
