import { allowedFileBoundaryList, type NormalizedCodexManifest } from "./manifest.js";
import { redactSensitiveText } from "./redaction.js";

export interface CodexFailureSummary {
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  jsonlMessages: string[];
}

export function renderCodexBuildPrompt(manifest: NormalizedCodexManifest): string {
  return [
    "You are the Codex build worker for the Governed Agentic Automation Factory.",
    "Use only the approved build_manifest.json and AGENTS.md in this isolated workspace.",
    "",
    `Request id: ${manifest.requestId}`,
    `Template: ${manifest.templateId}`,
    `Artifact type: ${manifest.artifactType}`,
    `PII policy: ${manifest.piiPolicy}`,
    "",
    "Approved Customer360 artifact boundary:",
    allowedFileBoundaryList(manifest),
    "",
    "Approved data sources:",
    manifest.approvedDataSources.map((source) => `- ${source}`).join("\n"),
    "",
    "Approved metrics:",
    manifest.approvedMetrics.map((metric) => `- ${metric}`).join("\n"),
    "",
    "Required filters:",
    manifest.requiredFilters.map((filter) => `- ${filter}`).join("\n"),
    "",
    "Output targets:",
    manifest.outputTargets.map((target) => `- ${target}`).join("\n"),
    "",
    "Acceptance criteria:",
    manifest.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n"),
    "",
    "Hard constraints:",
    "- Stay inside the current workspace and the explicit allowed file boundary.",
    "- Keep the artifact Customer360-focused and local-simulated.",
    "- Do not access production systems, credentials, browser storage, .env files, or unapproved network services.",
    "- Do not display or log raw names, emails, or phone numbers. Use masking helpers when customer labels are needed.",
    "- Do not delete existing files unless the manifest explicitly allows the exact file.",
    "- Keep tests runnable through the existing npm workspace scripts.",
    "",
    "Finish by summarizing changed files, tests you added or updated, and any skipped checks."
  ].join("\n");
}

export function renderCodexRepairPrompt(
  manifest: NormalizedCodexManifest,
  failure: CodexFailureSummary,
  repairAttempt: number
): string {
  const failureLines = [
    `Previous exit code: ${failure.exitCode ?? "unknown"}`,
    `Previous timed out: ${failure.timedOut ? "yes" : "no"}`,
    `Previous duration ms: ${failure.durationMs}`,
    "Previous stdout summary:",
    redactSensitiveText(failure.stdout, { maxLength: 1400 }),
    "Previous stderr summary:",
    redactSensitiveText(failure.stderr, { maxLength: 1400 }),
    "Previous JSONL messages:",
    ...failure.jsonlMessages.map((message) => `- ${redactSensitiveText(message, { maxLength: 300 })}`)
  ];

  return [
    "You are running a bounded repair attempt for the Governed Agentic Automation Factory Codex worker.",
    `Repair attempt: ${repairAttempt}`,
    `Request id: ${manifest.requestId}`,
    `Template: ${manifest.templateId}`,
    "",
    "Repair only the minimum required to address the prior failure. Preserve all governance constraints.",
    "Do not broaden scope, access secrets, display raw PII, or write outside the allowed files.",
    "",
    "Allowed files remain:",
    allowedFileBoundaryList(manifest),
    "",
    "Redacted prior failure summary:",
    failureLines.join("\n"),
    "",
    "Finish by summarizing the minimal changes and checks to rerun."
  ].join("\n");
}

export function renderWorkspaceAgentsMarkdown(manifest: NormalizedCodexManifest): string {
  return [
    "# Agent Instructions",
    "",
    "You are operating inside an isolated Customer360 build workspace created by the Governed Agentic Automation Factory.",
    "Follow the approved build manifest. Do not expand scope beyond the template, artifact type, output targets, and allowed files below.",
    "",
    "## Approved Boundary",
    "",
    allowedFileBoundaryList(manifest),
    "",
    "## Required Guardrails",
    "",
    "- Sandbox-only work. Do not deploy to production.",
    "- Do not read `.env`, credential files, browser storage, keychains, or token caches.",
    "- Do not log raw PII. Mask names, emails, and phone numbers according to `mask_email_name_phone` unless the manifest says stricter.",
    "- Do not call external systems unless an approved template script already does so for local package/test execution.",
    "- Keep generated tests and documentation aligned with the Customer360 dashboard scenario.",
    "- Stop and report a blocker if a requested change requires files outside the approved boundary.",
    "",
    "## Approved Manifest Snapshot",
    "",
    "```json",
    JSON.stringify(
      {
        request_id: manifest.requestId,
        template_id: manifest.templateId,
        artifact_type: manifest.artifactType,
        approved_data_sources: manifest.approvedDataSources,
        approved_metrics: manifest.approvedMetrics,
        required_filters: manifest.requiredFilters,
        pii_policy: manifest.piiPolicy,
        output_targets: manifest.outputTargets,
        forbidden_actions: manifest.forbiddenActions,
        max_repair_attempts: manifest.maxRepairAttempts,
        sandbox_only: manifest.sandboxOnly
      },
      null,
      2
    ),
    "```"
  ].join("\n");
}
