import { z } from "zod";

export const automationRequestStatuses = [
  "draft",
  "needs_clarification",
  "awaiting_governance",
  "approved_for_build",
  "building",
  "testing",
  "awaiting_release_approval",
  "deployed",
  "rejected",
  "failed"
] as const;

export const riskLevels = ["low", "medium", "high"] as const;

export const UiPathContextSchema = z.object({
  baseUrl: z.string().url(),
  organization: z.string().min(1),
  tenant: z.string().min(1),
  folderName: z.string().min(1),
  folderKey: z.string().optional()
});

export const IntakeRequestSchema = z.object({
  title: z.string().min(4),
  requesterEmail: z.string().email(),
  businessGoal: z.string().min(12),
  targetAudience: z.string().min(2),
  dueDate: z.string().optional(),
  sourceSystems: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([])
});

export const StructuredSpecSchema = z.object({
  requestId: z.string().min(1),
  objective: z.string().min(12),
  requiredCapabilities: z.array(z.string()).min(1),
  dataSources: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()).min(1),
  governanceNotes: z.array(z.string()).default([])
});

export const GovernanceAssessmentSchema = z.object({
  requestId: z.string().min(1),
  riskLevel: z.enum(riskLevels),
  requiresHumanApproval: z.boolean(),
  requiredPermissions: z.array(z.string()),
  blockers: z.array(z.string()).default([])
});

export const BuildManifestSchema = z.object({
  requestId: z.string().min(1),
  template: z.literal("customer360-dashboard"),
  branchName: z.string().min(1),
  outputApp: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  permissions: z.array(z.string()).default([]),
  codexModel: z.string().default("gpt-5.5")
});

export const BuildRunSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  status: z.enum(["queued", "running", "passed", "failed"]),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  logsUrl: z.string().url().optional(),
  pullRequestUrl: z.string().url().optional(),
  deploymentUrl: z.string().url().optional()
});

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  actor: z.string().min(1),
  action: z.string().min(1),
  summary: z.string().min(1),
  createdAt: z.string().datetime()
});

export type UiPathContext = z.infer<typeof UiPathContextSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type StructuredSpec = z.infer<typeof StructuredSpecSchema>;
export type GovernanceAssessment = z.infer<typeof GovernanceAssessmentSchema>;
export type BuildManifest = z.infer<typeof BuildManifestSchema>;
export type BuildRun = z.infer<typeof BuildRunSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AutomationRequestStatus = (typeof automationRequestStatuses)[number];

export interface AutomationRequest {
  id: string;
  intake: IntakeRequest;
  status: AutomationRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export const defaultUiPathContext: UiPathContext = {
  baseUrl: "https://cloud.uipath.com",
  organization: "galacticus",
  tenant: "DefaultTenant",
  folderName: "AgentFactoryDemo"
};

export function createAuditEvent(
  input: Omit<AuditEvent, "id" | "createdAt"> & Partial<Pick<AuditEvent, "id" | "createdAt">>
): AuditEvent {
  return AuditEventSchema.parse({
    ...input,
    id: input.id ?? `audit_${Date.now()}`,
    createdAt: input.createdAt ?? new Date().toISOString()
  });
}
