import { LifecycleMetadataSchema, type LifecycleMetadata } from "@agent-factory/shared-contracts";

export const lifecycleGraphNodes = [
  "request_created",
  "intake_classification",
  "clarification_generation",
  "clarification_answers",
  "requirements_spec_generation",
  "governance_assessment",
  "scope_approval",
  "build_plan",
  "build_queue",
  "build_worker",
  "deployment"
] as const;

export type LifecycleGraphNode = (typeof lifecycleGraphNodes)[number];

const lifecycleGraphEdges: Record<LifecycleGraphNode, LifecycleGraphNode[]> = {
  request_created: ["intake_classification", "clarification_generation"],
  intake_classification: ["clarification_generation", "requirements_spec_generation"],
  clarification_generation: ["clarification_answers", "clarification_generation"],
  clarification_answers: ["requirements_spec_generation", "governance_assessment"],
  requirements_spec_generation: ["governance_assessment"],
  governance_assessment: ["scope_approval"],
  scope_approval: ["build_plan"],
  build_plan: ["build_queue"],
  build_queue: ["build_worker"],
  build_worker: ["deployment", "build_worker"],
  deployment: ["deployment"]
};

export function createGraphRunMetadata(requestId: string, now: string): LifecycleMetadata {
  return LifecycleMetadataSchema.parse({
    graph_run_id: `GRAPH-${requestId}`,
    graph_node_id: "request_created",
    graph_transition: {
      to: "request_created",
      reason: "Request record created.",
      at: now
    },
    updated_at: now
  });
}

export function transitionGraphMetadata(input: {
  requestId: string;
  current?: LifecycleMetadata;
  to: LifecycleGraphNode;
  reason: string;
  now: string;
}): LifecycleMetadata {
  const from = input.current?.graph_node_id;
  const graphRunId = input.current?.graph_run_id ?? `GRAPH-${input.requestId}`;

  if (from && isLifecycleGraphNode(from)) {
    const allowed = lifecycleGraphEdges[from];
    if (!allowed.includes(input.to) && from !== input.to) {
      throw new Error(`Invalid lifecycle graph transition from ${from} to ${input.to}.`);
    }
  }

  return LifecycleMetadataSchema.parse({
    ...input.current,
    graph_run_id: graphRunId,
    graph_node_id: input.to,
    graph_transition: {
      from,
      to: input.to,
      reason: input.reason,
      at: input.now
    },
    updated_at: input.now
  });
}

function isLifecycleGraphNode(value: string): value is LifecycleGraphNode {
  return lifecycleGraphNodes.includes(value as LifecycleGraphNode);
}
