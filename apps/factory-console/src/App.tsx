import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Code2,
  Database,
  FileJson,
  FlaskConical,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCw,
  ScrollText,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Workflow,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { defaultUiPathContext, type IntakeRequest } from "@agent-factory/shared-contracts";
import {
  checkFactoryApi,
  submitIntakeToFactoryApi,
  type FactoryApiStatus
} from "./factoryClient";
import {
  auditEvents,
  buildArtifacts,
  buildManifest,
  clarificationQuestions,
  createConsoleAudit,
  createLocalRequest,
  governanceAssessment,
  lifecycleSteps,
  manifestDocument,
  metricOptions,
  piiPolicies,
  policyDecisions,
  qualityGates,
  seedIntake,
  seedRequest,
  sourceSystems,
  structuredSpec
} from "./seedData";

type WorkspaceTab = "clarification" | "spec" | "manifest" | "audit";
type SubmitState = "idle" | "loading" | "success" | "error";
type ApprovalState = "pending" | "approved" | "changes";

const workspaceTabs: Array<{ id: WorkspaceTab; label: string; icon: LucideIcon }> = [
  { id: "clarification", label: "Clarify", icon: MessageSquareText },
  { id: "spec", label: "Spec", icon: ScrollText },
  { id: "manifest", label: "Manifest", icon: FileJson },
  { id: "audit", label: "Audit", icon: Clock3 }
];

const checkingStatus: FactoryApiStatus = {
  mode: "checking",
  platformMode: "local-simulated",
  apiBaseUrl: "http://localhost:8787",
  label: "Checking Factory API",
  detail: "Probing the local Factory API spine."
};

const lifecycleIcons: Record<string, LucideIcon> = {
  intake: Send,
  clarification: MessageSquareText,
  governance: ShieldCheck,
  manifest: FileJson,
  build: Code2,
  quality: FlaskConical
};

export function App() {
  const [apiStatus, setApiStatus] = useState<FactoryApiStatus>(checkingStatus);
  const [intake, setIntake] = useState<IntakeRequest>(seedIntake);
  const [request, setRequest] = useState(seedRequest);
  const [selectedSources, setSelectedSources] = useState(() => new Set(seedIntake.sourceSystems));
  const [selectedMetrics, setSelectedMetrics] = useState(() => new Set(metricOptions.map((metric) => metric.id)));
  const [selectedPolicy, setSelectedPolicy] = useState<(typeof piiPolicies)[number]>(piiPolicies[0]);
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(clarificationQuestions.map((question) => [question.id, question.defaultAnswer]))
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("clarification");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [auditLog, setAuditLog] = useState(auditEvents);

  useEffect(() => {
    let mounted = true;

    checkFactoryApi().then((status) => {
      if (mounted) {
        setApiStatus(status);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const currentIntake = useMemo<IntakeRequest>(
    () => ({
      ...intake,
      sourceSystems: [...selectedSources],
      constraints: [
        "sandbox_only",
        "no_production_deploy",
        selectedPolicy.toLowerCase().replaceAll(" ", "_").replaceAll(",", "")
      ]
    }),
    [intake, selectedPolicy, selectedSources]
  );

  const selectedSourceRecords = useMemo(
    () => sourceSystems.filter((source) => selectedSources.has(source.id)),
    [selectedSources]
  );

  const selectedMetricRecords = useMemo(
    () => metricOptions.filter((metric) => selectedMetrics.has(metric.id)),
    [selectedMetrics]
  );

  const specPreview = useMemo(
    () => ({
      ...structuredSpec,
      dataSources: selectedSourceRecords.map((source) => source.label),
      requiredCapabilities: [
        ...structuredSpec.requiredCapabilities.slice(0, 2),
        `${selectedMetricRecords.length} governed metrics selected`,
        ...structuredSpec.requiredCapabilities.slice(2)
      ]
    }),
    [selectedMetricRecords.length, selectedSourceRecords]
  );

  const manifestPreview = useMemo(
    () => ({
      ...manifestDocument,
      approved_data_sources: selectedSourceRecords.map((source) => source.id),
      approved_metrics: selectedMetricRecords.map((metric) => metric.id),
      pii_policy: selectedPolicy.toLowerCase().replaceAll(" ", "_").replaceAll(",", "")
    }),
    [selectedMetricRecords, selectedPolicy, selectedSourceRecords]
  );

  const answeredCount = Object.values(answers).filter((answer) => answer.trim().length > 0).length;
  const sourceReadyCount = selectedSourceRecords.filter((source) => source.status !== "needs_mapping").length;
  const canSubmit = intake.title.length >= 4 && intake.requesterEmail.includes("@") && intake.businessGoal.length >= 12;

  async function refreshApiStatus() {
    setApiStatus(checkingStatus);
    setApiStatus(await checkFactoryApi());
  }

  async function submitIntake() {
    if (!canSubmit) {
      setSubmitState("error");
      return;
    }

    setSubmitState("loading");
    const apiRequest = await submitIntakeToFactoryApi(currentIntake);
    const nextRequest = apiRequest ?? createLocalRequest(currentIntake);

    setRequest({
      ...nextRequest,
      intake: currentIntake
    });
    setAuditLog((current) => [
      ...current,
      createConsoleAudit(
        apiRequest
          ? `Factory API accepted intake request ${nextRequest.id}.`
          : "Local simulation captured intake while Factory API lifecycle endpoints are unavailable.",
        current.length + 1
      )
    ]);
    setSubmitState("success");
    setActiveTab("clarification");
  }

  function updateIntakeField(field: "title" | "requesterEmail" | "businessGoal" | "targetAudience" | "dueDate") {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIntake((current) => ({
        ...current,
        [field]: event.target.value
      }));
    };
  }

  function toggleSource(sourceId: string) {
    setSelectedSources((current) => {
      const next = new Set(current);

      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }

      return next;
    });
  }

  function toggleMetric(metricId: string) {
    setSelectedMetrics((current) => {
      const next = new Set(current);

      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }

      return next;
    });
  }

  return (
    <main className="factory-shell">
      <aside className="lifecycle-rail" aria-label="Factory lifecycle">
        <div className="brand">
          <div className="brand-mark">AF</div>
          <div>
            <strong>Agent Factory</strong>
            <span>UiPath governed build ops</span>
          </div>
        </div>

        <div className="mode-panel" data-mode={apiStatus.mode}>
          <span>{apiStatus.platformMode}</span>
          <strong>{apiStatus.label}</strong>
          <small>{apiStatus.apiBaseUrl}</small>
        </div>

        <nav className="lifecycle-list">
          {lifecycleSteps.map((step) => {
            const Icon = lifecycleIcons[step.id] ?? Circle;

            return (
              <button
                className="lifecycle-step"
                data-status={step.status}
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === "manifest") setActiveTab("manifest");
                  if (step.id === "clarification") setActiveTab("clarification");
                  if (step.id === "governance") setActiveTab("spec");
                  if (step.id === "quality") setActiveTab("audit");
                }}
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.product}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="platform-stack">
          <span>UiPath stack</span>
          {[
            "Maestro",
            "Agents",
            "Action Center",
            "Data Service",
            "API Workflow",
            "Orchestrator",
            "Test Cloud"
          ].map((label) => (
            <small key={label}>{label}</small>
          ))}
        </div>
      </aside>

      <section className="console-shell">
        <header className="command-bar">
          <div>
            <p className="eyeline">Checkpoint 1 Factory Console</p>
            <h1>Customer360 build control plane</h1>
            <p>
              Request intake, clarification, governance, manifest preview, approval state, and audit
              evidence in one operations surface.
            </p>
          </div>
          <div className="command-actions">
            <button className="icon-button" type="button" onClick={refreshApiStatus} aria-label="Refresh API status">
              <RefreshCw size={17} aria-hidden="true" />
            </button>
            <button className="primary-action" type="button" onClick={submitIntake} disabled={submitState === "loading"}>
              {submitState === "loading" ? (
                <Loader2 className="spin-icon" size={17} aria-hidden="true" />
              ) : (
                <Play size={17} aria-hidden="true" />
              )}
              <span>{submitState === "loading" ? "Submitting" : "Submit intake"}</span>
            </button>
          </div>
        </header>

        <section className="status-strip" aria-label="Request status">
          <StatusMetric label="Request" value={request.id} icon={ScrollText} />
          <StatusMetric label="Status" value={formatStatus(request.status)} icon={CircleDot} tone="blue" />
          <StatusMetric label="Clarifications" value={`${answeredCount}/${clarificationQuestions.length} answered`} icon={MessageSquareText} />
          <StatusMetric label="Sources ready" value={`${sourceReadyCount}/${selectedSources.size || 1}`} icon={Database} tone="green" />
          <StatusMetric label="Approval" value={approvalState === "approved" ? "Scope approved" : "Pending"} icon={UserCheck} tone={approvalState === "approved" ? "green" : "amber"} />
        </section>

        {apiStatus.mode === "degraded" ? (
          <div className="system-banner" role="status">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>{apiStatus.label}</strong>
              <span>{apiStatus.detail}</span>
            </div>
          </div>
        ) : null}

        {submitState === "success" ? (
          <div className="success-banner" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Intake captured. Clarification and governance previews are synchronized to local state.</span>
          </div>
        ) : null}

        {submitState === "error" ? (
          <div className="error-banner" role="alert">
            <XCircle size={18} aria-hidden="true" />
            <span>Title, requester email, and business goal are required before intake can be submitted.</span>
          </div>
        ) : null}

        <div className="console-grid">
          <section className="panel intake-panel" aria-labelledby="intake-title">
            <PanelHeader
              icon={SlidersHorizontal}
              title="Request intake"
              meta="Factory API / Data Service"
              action={<Pill tone={apiStatus.mode === "online" ? "success" : "warning"}>{apiStatus.platformMode}</Pill>}
            />

            <div className="form-grid">
              <label className="field wide">
                <span>Build request</span>
                <input value={intake.title} onChange={updateIntakeField("title")} />
              </label>
              <label className="field">
                <span>Requester</span>
                <input value={intake.requesterEmail} onChange={updateIntakeField("requesterEmail")} />
              </label>
              <label className="field">
                <span>Due date</span>
                <input type="date" value={intake.dueDate ?? ""} onChange={updateIntakeField("dueDate")} />
              </label>
              <label className="field wide">
                <span>Business goal</span>
                <textarea rows={5} value={intake.businessGoal} onChange={updateIntakeField("businessGoal")} />
              </label>
              <label className="field wide">
                <span>Target audience</span>
                <input value={intake.targetAudience} onChange={updateIntakeField("targetAudience")} />
              </label>
            </div>

            <div className="section-rule">
              <h2>Source controls</h2>
              <small>Read scopes and mapping readiness</small>
            </div>
            <div className="toggle-grid">
              {sourceSystems.map((source) => (
                <button
                  aria-pressed={selectedSources.has(source.id)}
                  className="source-toggle"
                  data-selected={selectedSources.has(source.id)}
                  key={source.id}
                  type="button"
                  onClick={() => toggleSource(source.id)}
                >
                  <span className="toggle-title">
                    <Database size={16} aria-hidden="true" />
                    <strong>{source.label}</strong>
                  </span>
                  <span>{source.owner}</span>
                  <small>{source.product}</small>
                  <Pill tone={source.status === "approved" ? "success" : source.status === "read_only" ? "neutral" : "warning"}>
                    {source.status.replaceAll("_", " ")}
                  </Pill>
                </button>
              ))}
            </div>

            <div className="controls-row">
              <label className="field">
                <span>PII policy</span>
                <select value={selectedPolicy} onChange={(event) => setSelectedPolicy(event.target.value as (typeof piiPolicies)[number])}>
                  {piiPolicies.map((policy) => (
                    <option key={policy}>{policy}</option>
                  ))}
                </select>
              </label>
              <div className="metric-picker">
                <span>Metric scope</span>
                {metricOptions.map((metric) => (
                  <label key={metric.id} className="check-row">
                    <input
                      checked={selectedMetrics.has(metric.id)}
                      type="checkbox"
                      onChange={() => toggleMetric(metric.id)}
                    />
                    <span>
                      <strong>{metric.label}</strong>
                      <small>{metric.guardrail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="panel workspace-panel" aria-labelledby="workspace-title">
            <PanelHeader
              icon={Workflow}
              title="Lifecycle workspace"
              meta="UiPath Maestro / Agents"
              action={<Pill tone="neutral">REQ status: {formatStatus(request.status)}</Pill>}
            />

            <div className="tab-list" role="tablist" aria-label="Workspace views">
              {workspaceTabs.map(({ id, label, icon: Icon }) => (
                <button
                  aria-selected={activeTab === id}
                  className="tab-button"
                  key={id}
                  role="tab"
                  type="button"
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "clarification" ? (
              <div className="clarification-list">
                {submitState === "loading" ? <LoadingRow label="UiPath Agents are shaping clarification questions" /> : null}
                {clarificationQuestions.map((question) => (
                  <label className="question-row" key={question.id}>
                    <span>
                      <Pill tone="neutral">{question.product}</Pill>
                      <strong>{question.question}</strong>
                    </span>
                    <textarea
                      rows={3}
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            ) : null}

            {activeTab === "spec" ? (
              <div className="spec-layout">
                <div>
                  <h2>Structured spec preview</h2>
                  <p>{specPreview.objective}</p>
                  <KeyValueList
                    rows={[
                      ["Request", specPreview.requestId],
                      ["Audience", currentIntake.targetAudience],
                      ["Data sources", specPreview.dataSources.join(", ") || "None selected"],
                      ["PII posture", selectedPolicy]
                    ]}
                  />
                </div>
                <div className="spec-columns">
                  <ListBlock title="Required capabilities" items={specPreview.requiredCapabilities} />
                  <ListBlock title="Acceptance criteria" items={specPreview.acceptanceCriteria} />
                  <ListBlock title="Governance notes" items={specPreview.governanceNotes} />
                </div>
              </div>
            ) : null}

            {activeTab === "manifest" ? (
              <div className="manifest-layout">
                <div className="manifest-summary">
                  <KeyValueList
                    rows={[
                      ["Template", buildManifest.template],
                      ["Branch", buildManifest.branchName],
                      ["Output", buildManifest.outputApp],
                      ["Codex model", buildManifest.codexModel],
                      ["Sandbox only", manifestPreview.sandbox_only ? "true" : "false"]
                    ]}
                  />
                  <div className="artifact-table">
                    <div className="table-heading">
                      <span>Planned generated files</span>
                      <small>Codex worker queue</small>
                    </div>
                    {buildArtifacts.map((artifact) => (
                      <div className="artifact-row" key={artifact.path}>
                        <Code2 size={15} aria-hidden="true" />
                        <span>{artifact.path}</span>
                        <small>{artifact.owner}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <pre className="json-viewer">{JSON.stringify(manifestPreview, null, 2)}</pre>
              </div>
            ) : null}

            {activeTab === "audit" ? <AuditTable auditLog={auditLog} /> : null}
          </section>

          <aside className="panel inspector-panel" aria-labelledby="governance-title">
            <PanelHeader icon={ShieldCheck} title="Governance" meta="Action Center approval" />
            <div className="risk-block" data-risk={governanceAssessment.riskLevel}>
              <span>Risk tier</span>
              <strong>{governanceAssessment.riskLevel}</strong>
              <small>{governanceAssessment.requiresHumanApproval ? "Human approval required" : "No approval required"}</small>
            </div>

            <div className="decision-list">
              {policyDecisions.map((decision) => (
                <div className="decision-row" key={decision.label}>
                  <span>{decision.label}</span>
                  <Pill tone={decision.severity}>{decision.value}</Pill>
                </div>
              ))}
            </div>

            <div className="approval-box" data-state={approvalState}>
              <UserCheck size={18} aria-hidden="true" />
              <div>
                <strong>
                  {approvalState === "approved"
                    ? "Scope approved"
                    : approvalState === "changes"
                      ? "Changes requested"
                      : "Awaiting scope approval"}
                </strong>
                <span>Action Center gate before manifest handoff to Codex worker.</span>
              </div>
            </div>

            <div className="approval-actions">
              <button type="button" onClick={() => setApprovalState("approved")}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Approve
              </button>
              <button type="button" onClick={() => setApprovalState("changes")}>
                <MessageSquareText size={16} aria-hidden="true" />
                Request changes
              </button>
            </div>

            <div className="platform-routing">
              <h2>Platform route</h2>
              <KeyValueList
                rows={[
                  ["Organization", defaultUiPathContext.organization],
                  ["Tenant", defaultUiPathContext.tenant],
                  ["Folder", defaultUiPathContext.folderName],
                  ["Maestro", "Request-to-release lifecycle"],
                  ["API Workflow", "TriggerBuildWorker ready"]
                ]}
              />
            </div>
          </aside>
        </div>

        <section className="lower-grid">
          <div className="panel quality-panel">
            <PanelHeader icon={FlaskConical} title="Quality gate" meta="Test Cloud-ready placeholder" />
            <div className="quality-grid">
              {qualityGates.map((gate) => (
                <div className="quality-row" data-status={gate.status} key={gate.name}>
                  {gate.status === "passed" ? <CheckCircle2 size={17} aria-hidden="true" /> : <CircleDot size={17} aria-hidden="true" />}
                  <span>
                    <strong>{gate.name}</strong>
                    <small>{gate.provider}</small>
                  </span>
                  <em>{gate.detail}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="panel audit-panel">
            <PanelHeader icon={ScrollText} title="Timeline and audit" meta="Data Service event stream" />
            <AuditTable auditLog={auditLog.slice(-4)} compact />
          </div>
        </section>
      </section>
    </main>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  meta,
  action
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        <span className="panel-icon">
          <Icon size={17} aria-hidden="true" />
        </span>
        <div>
          <h2>{title}</h2>
          <small>{meta}</small>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatusMetric({
  label,
  value,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "blue" | "green" | "amber";
}) {
  return (
    <div className="status-metric" data-tone={tone}>
      <Icon size={17} aria-hidden="true" />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

function Pill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span className="pill" data-tone={tone}>
      {children}
    </span>
  );
}

function KeyValueList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="key-value-list">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="list-block">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="loading-row">
      <Loader2 className="spin-icon" size={17} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function AuditTable({ auditLog, compact = false }: { auditLog: typeof auditEvents; compact?: boolean }) {
  if (auditLog.length === 0) {
    return (
      <div className="empty-state">
        <Circle size={18} aria-hidden="true" />
        <span>No audit events recorded.</span>
      </div>
    );
  }

  return (
    <div className="audit-table" data-compact={compact}>
      {auditLog.map((event) => (
        <div className="audit-row" key={event.id}>
          <span className="audit-time">{formatAuditTime(event.createdAt)}</span>
          <span className="audit-actor">{event.actor}</span>
          <span className="audit-action">{event.action.replaceAll("_", " ")}</span>
          <span className="audit-summary">{event.summary}</span>
        </div>
      ))}
    </div>
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatAuditTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
