You are the Checkpoint 3 Codex Runner implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Other workers are editing other lanes in parallel, so do not revert unrelated changes and keep edits inside your ownership boundaries.

Read first:
- `AGENTS.md`
- `docs/orchestration/checkpoint-3/README.md`
- `governed_agentic_automation_factory_final_build_spec.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/customer360-template.md`
- `services/build-worker/src/index.ts`
- `services/build-worker/test/build-plan.test.ts`

Base state: `main` at `9a8a332`.

Goal:
Implement the Codex execution adapter and prompt templates for the build worker. The final adapter should construct safe Codex commands, run them with bounded execution, capture JSONL/stdout/stderr into redacted logs, detect failure, and optionally run one bounded repair attempt when the manifest allows it.

Ownership:
- You may edit `services/build-worker/src/codex/**` and `services/build-worker/prompts/**`.
- You may update `services/build-worker/src/index.ts` only to preserve or export Codex runner compatibility if absolutely necessary; keep such edits minimal and clearly documented.
- Do not edit `services/build-worker/src/server.ts`, `src/store.ts`, `src/git/**`, `src/artifacts/**`, `src/github/**`, root package files, app code, generated `dist/**`, or `node_modules/**`.

Implementation requirements:
- Default to `codex exec --sandbox workspace-write --skip-git-repo-check`.
- Support model override but avoid hard-coding a broken model assumption; preserve manifest model when supplied.
- Include a readiness helper for `codex exec --sandbox read-only --skip-git-repo-check "Reply only: Codex ready."`.
- Build prompts that constrain Codex to the approved Customer360 artifact boundary and explicit allowed files.
- Capture command, exit code, duration, stdout/stderr or JSONL lines, and inferred session id when present.
- Redact token-like strings, env-looking secrets, emails/phones if they appear in logs, and never read `.env` or credential files.
- Implement repair attempt logic with a max count from manifest/options; repair prompts must include prior failure summary but not raw secrets.
- Provide fake-runner-friendly interfaces so tests do not need to invoke live Codex.

Verification:
- Run `npm --workspace @agent-factory/build-worker test`.
- Run `npm --workspace @agent-factory/build-worker run build`.
- Run `git diff --check`.
- If feasible, run `codex exec --sandbox read-only --skip-git-repo-check "Reply only: Codex ready."` and report result.

Handoff:
Commit your lane changes locally. Report changed files, commit id, exported runner API, prompt files, checks run/results, live Codex readiness result or reason skipped, risks, and integration notes.
