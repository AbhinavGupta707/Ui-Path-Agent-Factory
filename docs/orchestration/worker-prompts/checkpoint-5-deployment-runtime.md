You are the Checkpoint 5 Deployment And Runtime implementation lane for the Governed Agentic Automation Factory.

Work in your isolated worktree. Read and follow:
- AGENTS.md
- docs/orchestration/checkpoint-5/README.md
- docs/orchestration/checkpoint-5/status.md
- governed_agentic_automation_factory_final_build_spec.md
- governed_agentic_automation_factory_implementation_plan.md
- docs/api-workflow-contract.md
- uipath/api-workflows/contracts.md

Base state: `main` at commit `9786622`.

## Goal

Close the deployment/runtime gap for the final demo. The product should have a real sandbox deployment contract that `AgentFactory_StartDeployment` can call locally/no-auth, plus clear Vercel/sandbox deployment configuration and docs.

## Ownership

You may edit:
- `services/factory-api/src/**`
- `services/factory-api/test/**`
- `uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json`
- `uipath/api-workflows/contracts.md`
- `docs/api-workflow-contract.md`
- `docs/deployment.md`
- `docs/setup.md`
- `.env.example`
- `vercel.json`, `.vercelignore`, and deployment-only config files
- `scripts/deploy-*.mjs` or `scripts/deploy-*.sh`

Coordinate or avoid:
- Root `package.json`: do not edit unless strictly required; Final QA owns final demo scripts.
- `apps/**`: do not polish UI here; Demo UX owns it.
- `README.md` and Devpost docs: Submission Package owns them.

Do not edit:
- `.env`
- `.vercel/**`
- `dist/**`
- `node_modules/**`
- `.uipath/.skills/**`
- `.agents/skills/**`

## Implementation Requirements

- Implement or document a sandbox `/deploy` endpoint aligned with `AgentFactory_StartDeployment`.
- Preserve idempotency through `operationId` or `x-agent-factory-operation-id`.
- Return deployment evidence including request id, build run id, environment, deployment status, deployment URL when known, rollback notes, and platform mode.
- Keep production deployment disabled unless explicitly approved.
- Preview/sandbox Vercel deployment is allowed if the CLI is authenticated and the command is non-destructive. Do not commit `.vercel`.
- If live Vercel deployment is blocked, produce exact commands and a local sandbox fallback.
- Update API Workflow docs and `AgentFactory_StartDeployment` only if the endpoint URL or payload contract changes.
- Keep all claims honest: use `uipath-ready` until a real UiPath asset or workflow runs; use preview/sandbox labels for hosted artifacts.

## Verification

Run:
- `npm --workspace @agent-factory/factory-api test`
- `npm --workspace @agent-factory/factory-api run build`
- `uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json`
- `vercel --version`
- `git diff --check`

If you add deployment helper scripts, run their dry-run/help mode or document why not.

## Handoff

Commit your lane changes locally. Report files changed, commit id, endpoint/API contract, deployment commands run or skipped, preview URLs if created, checks run, blockers/approvals needed, and merge notes.
