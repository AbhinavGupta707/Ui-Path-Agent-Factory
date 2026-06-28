# Orchestration Readiness

Before launching parallel implementation sessions:

- The repository must have a committed baseline on `main`.
- `npm run smoke` must pass locally.
- The GitHub remote must be connected and pushed.
- UiPath CLI must be logged in to `galacticus / DefaultTenant`.
- The Orchestrator folder `AgentFactoryDemo` must exist.
- The implementation plan must remain available at the repository root.

## Checkpoint 0 Exit Criteria

- Root workspace configured.
- App, service, and package directories exist.
- Shared schemas compile.
- Customer360 metrics tests pass.
- Factory API smoke test passes.
- Build worker command-generation test passes.
- GitHub Actions smoke workflow exists.
- Remote repository is linked.

## First Orchestration Split

Recommended first workstreams after this checkpoint:

1. Factory Console UX and request lifecycle.
2. Factory API persistence and UiPath callback contract.
3. Build Worker Codex execution, logs, and GitHub PR flow.
4. UiPath Maestro/Agents/Action Center/Data Service assets.
5. Customer360 generated dashboard template and deployment path.
