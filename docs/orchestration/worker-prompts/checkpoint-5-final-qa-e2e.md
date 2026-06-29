You are the Checkpoint 5 Final QA And E2E implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Read and follow:
- AGENTS.md
- docs/orchestration/checkpoint-5/README.md
- docs/orchestration/checkpoint-5/status.md
- docs/orchestration/checkpoint-4/status.md
- governed_agentic_automation_factory_final_build_spec.md
- governed_agentic_automation_factory_implementation_plan.md

Base state: latest `main` at worker launch; the orchestrator records the exact base in `docs/orchestration/checkpoint-5/status.md`.

## Goal

Make the final demo repeatable and trustworthy. Add a local demo smoke/reset/checklist layer that proves the request-to-deployment story can be rehearsed and that privacy/security claims are checked.

## Ownership

You may edit:
- `scripts/**`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/qa-checklist.md`
- `docs/final-readiness.md`
- `docs/orchestration/checkpoint-5/status.md` only for lane-local results
- focused tests if needed under `services/**/test/**` or `apps/**/test/**`

Coordinate or avoid:
- Do not change backend contracts owned by Deployment/Runtime unless you only add tests around merged behavior.
- Do not polish UI; Demo UX owns it.
- Do not rewrite README/demo script; Submission Package owns it.

Do not edit:
- `.env`
- `.vercel/**`
- `dist/**`
- `node_modules/**`
- `.uipath/.skills/**`
- `.agents/skills/**`

## Implementation Requirements

- Add `npm run smoke:demo` or equivalent that can run locally without secrets.
- Add a reset/seed helper if needed for repeatable demo state.
- Add a privacy/security scan for forbidden patterns: raw PII claims, secret reads, `.env` access, production deploy claims, unmasked customer display claims, and stale `pre-orchestration scaffold` wording.
- Add docs/checklist for browser verification across Factory Console and Customer360 dashboard.
- If browser-use or Chrome is available, run a local UI smoke and record viewport/results. Use localhost unless a preview URL exists.
- Keep no-network/no-secret behavior honest.

## Verification

Run:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run smoke`
- `npm run smoke:demo`
- `git diff --check`

If a command is unavailable or no-op, report the result honestly and add the smallest useful fallback.

## Handoff

Commit your lane changes locally. Report files changed, scripts added, commands run, browser/manual checks, privacy/security scan results, residual risks, and merge notes.
