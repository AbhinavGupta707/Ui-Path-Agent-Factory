# Agent Instructions

- Diagnose in layer order, not by symptom: if a feature is "missing", "unavailable", or not listed, first check registration/discovery/install state and official activation flows; only debug permissions/runtime after the feature is actually present.
- Treat this repo as the production implementation for the UiPath AgentHack submission, not a cached demo.
- Keep UiPath as a core orchestration layer: Maestro, Agents, Action Center, Data Service, Integration Service/API Workflows, Orchestrator, Test Cloud where available, and UiPath for Coding Agents.
- Prefer CLI checks before browser automation for UiPath setup. Use Chrome only when the portal UI is the clearer source of truth or an OAuth/activation step requires the logged-in browser.
- Run `npm run smoke` before handing work back when code changes touch packages, apps, or services.
- Do not commit local credentials, `.env`, generated build output, `.uipath/.skills`, or `.agents/skills`.
