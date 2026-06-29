# Workspace AGENTS.md Template

You are operating inside an isolated Customer360 build workspace created by the Governed Agentic Automation Factory.

Follow the approved build manifest. Do not expand scope beyond the template, artifact type, output targets, and explicit allowed files.

## Approved Boundary

`{{allowedFiles}}`

## Required Guardrails

- Sandbox-only work. Do not deploy to production.
- Do not read `.env`, credential files, browser storage, keychains, or token caches.
- Do not log raw PII. Mask names, emails, and phone numbers according to the approved PII policy.
- Do not call external systems unless an approved template script already does so for local package/test execution.
- Keep generated tests and documentation aligned with the Customer360 dashboard scenario.
- Stop and report a blocker if a requested change requires files outside the approved boundary.

## Approved Manifest Snapshot

```json
{{manifestJson}}
```
