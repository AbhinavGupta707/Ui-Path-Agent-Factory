You are the Checkpoint 5 Submission Package implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Read and follow:
- AGENTS.md
- docs/orchestration/checkpoint-5/README.md
- docs/orchestration/checkpoint-5/status.md
- governed_agentic_automation_factory_final_build_spec.md
- governed_agentic_automation_factory_implementation_plan.md
- README.md
- docs/uipath-setup.md
- docs/setup.md

Base state: `main` at commit `9786622`.

## Goal

Make the repository understandable and submission-ready for judges and reviewers. The package should explain exactly what is live, what is preview/sandbox, what requires explicit approval, and how to run the demo.

## Ownership

You may edit:
- `README.md`
- `LICENSE` if absent and a permissive license is appropriate for hackathon submission
- `docs/demo-script.md`
- `docs/devpost-submission.md`
- `docs/component-map.md`
- `docs/submission-checklist.md`
- `docs/uipath-setup.md`
- `docs/setup.md`
- `uipath/README.md`

Coordinate or avoid:
- Deployment command specifics should align with Deployment/Runtime if that lane changes them.
- Final QA owns scripts and CI changes.
- Do not modify app/service source.

Do not edit:
- `.env`
- `.vercel/**`
- `dist/**`
- `node_modules/**`
- `.uipath/.skills/**`
- `.agents/skills/**`

## Implementation Requirements

- Update README from scaffold language to current Checkpoint 5 reality.
- Include beginner-friendly setup and run commands.
- Include a clear five-minute demo script:
  request -> clarifications -> governance -> approvals -> manifest -> build worker -> tests -> release approval -> deployment -> audit.
- Include hackathon judging alignment and UiPath product usage.
- Include exact live status:
  - Test Manager project/test set/test cases are live.
  - Data Service schema is proposal-only until approval.
  - Maestro BPMN is import-ready until publish/run approval.
  - Agents/API Workflows are validated/import-ready until upload/run approval.
  - Action Center/App contracts are proposal-only until creation/deployment approval.
- Include Devpost copy, component list, and known limitations.
- Avoid overclaiming; make unavailable/live boundaries explicit.

## Verification

Run:
- markdown sanity checks available in repo or simple `rg` scans for stale scaffold wording
- `git diff --check`
- `npm run smoke` unless edits are purely docs and time is tight; if skipped, state why

## Handoff

Commit your lane changes locally. Report files changed, docs added/updated, stale wording removed, commands run, known open facts that need deployment/QA merge updates, and integration notes.
