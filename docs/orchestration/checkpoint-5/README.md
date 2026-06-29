# Checkpoint 5 - Deployment, Demo Polish, And Submission Package

## Goal

Make the Governed Agentic Automation Factory demo-ready for submission: a working sandbox deployment path, polished demo UI, clear hackathon package, and repeatable end-to-end smoke checks.

Checkpoint 5 should turn the integrated platform assets from Checkpoint 4 into a rehearsable story:

request -> clarification -> governance -> approval -> manifest -> build worker -> tests -> release approval -> sandbox deployment -> audit.

The checkpoint should prefer real preview/sandbox deployment where credentials and non-destructive commands allow it. Production deployment, destructive UiPath mutations, Action Center task completion, authenticated API Workflow runtime calls, and live Test Manager executions still require explicit user approval.

## Baseline

- Integration branch: `main`
- Launch base commit: recorded by the orchestrator when worker sessions are created.
- Checkpoints 1-4 are merged, pushed, and verified.
- Local baseline `npm run smoke` passed before launch.
- UiPath context: `galacticus / DefaultTenant / AgentFactoryDemo`.
- UiPath CLI version: `1.195.1`.
- GitHub CLI version: `2.89.0`.
- Vercel CLI version: `54.9.1`.

## Lanes

### 1. Deployment And Runtime

- Prompt: [checkpoint-5-deployment-runtime.md](../worker-prompts/checkpoint-5-deployment-runtime.md)
- Owns: deployment/runtime wiring, sandbox deploy endpoint, Vercel/sandbox config, deployment docs.
- Produces: local `/deploy` path for `AgentFactory_StartDeployment`, deployment evidence contract, preview/sandbox deployment setup, and exact env/run commands.

### 2. Demo UX Polish

- Prompt: [checkpoint-5-demo-ux-polish.md](../worker-prompts/checkpoint-5-demo-ux-polish.md)
- Owns: Factory Console and Customer360 dashboard polish.
- Produces: final demo-grade UI states for platform mode, quality gates, deployment, audit, responsive layout, and degraded/live-ready states.

### 3. Submission Package

- Prompt: [checkpoint-5-submission-package.md](../worker-prompts/checkpoint-5-submission-package.md)
- Owns: README, demo script, Devpost copy, setup/runbook, component map, and submission checklist.
- Produces: beginner-friendly setup, five-minute demo script, judging-aligned platform usage summary, known live/manual boundaries, and reset/rehearsal guidance.

### 4. Final QA And E2E

- Prompt: [checkpoint-5-final-qa-e2e.md](../worker-prompts/checkpoint-5-final-qa-e2e.md)
- Owns: repeatable demo smoke scripts, privacy/security scan, screenshot/browser checklist, CI/test wiring.
- Produces: `smoke:demo` or equivalent, local E2E verification, browser/manual checklist, and final risk register.

## Merge Order

1. Deployment And Runtime.
2. Demo UX Polish.
3. Submission Package.
4. Final QA And E2E.
5. Orchestrator final integration patch for cross-lane drift, final browser smoke, and submission readiness.

## Cross-Lane Contracts

- Keep `platformMode` honest: `uipath-live` only after an asset exists or runs in UiPath Automation Cloud.
- Preview/sandbox web deployment is allowed; production deployment requires explicit user approval.
- Do not commit `.env`, `.vercel`, `.uipath/.skills`, `.agents/skills`, generated `dist/**`, credentials, or captured browser storage.
- Keep all demo data synthetic and masked by default.
- Do not run authenticated API Workflow runtime calls, Action Center task completion, Data Service schema creation, Maestro publish/run, or Test Manager execution unless the user explicitly approves the exact action.
- Factory Console remains the primary polished demo surface; UiPath Apps remains the official UiPath companion surface.
- The `AgentFactory_StartDeployment` API Workflow currently expects a POST target at `/deploy`; Checkpoint 5 should either implement that sandbox endpoint or document a precise approved replacement.

## Verification

Run after all lanes merge:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:demo
git diff --check
```

Also run targeted checks added by lanes, such as:

```bash
uip api-workflow validate uipath/api-workflows/AgentFactory_StartDeployment/Workflow.json --output json
uip login status --output json
uip tm project list --limit 5 --output json
vercel --version
gh --version
```

Use browser or Chrome verification for the final local/demo UI pass once the app is runnable. If a hosted preview URL exists, verify the preview in browser/Chrome; otherwise verify localhost.

`npm audit --audit-level=moderate` is intentionally not automatic unless the user approves external npm registry metadata sharing.

## Manual Demo Rehearsal

- Start Factory API, Build Worker, Factory Console, and Customer360 dashboard.
- Submit the canonical Customer360 request.
- Answer clarifications and show governance/scope approval state.
- Generate/view the manifest and build worker evidence.
- Show quality gates and Test Manager/Test Cloud evidence.
- Show release approval and sandbox deployment evidence.
- Open the deployed or local generated dashboard.
- Mutate/switch synthetic data and confirm dashboard output changes.
- Reset state and repeat the five-minute flow.

## Non-Goals

- Production customer deployment.
- Real customer data or external CRM/Snowflake/Salesforce connections.
- Slack/Teams integration.
- Multiple template families.
- Destructive cleanup of live UiPath assets.
