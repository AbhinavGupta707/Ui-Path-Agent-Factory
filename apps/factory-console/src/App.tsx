import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDot,
  Database,
  ExternalLink,
  FileJson,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  PanelRightOpen,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Workflow,
  X,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { defaultUiPathContext, type IntakeRequest } from "@agent-factory/shared-contracts";
import {
  checkFactoryApi,
  getLifecycleSnapshot,
  submitIntakeToFactoryApi,
  type FactoryApiStatus,
  type LifecycleSnapshot
} from "./factoryClient";
import {
  auditEvents,
  buildArtifacts,
  buildLogEvents,
  buildManifest,
  buildRunEvidence,
  clarificationQuestions,
  createConsoleAudit,
  createLocalRequest,
  deploymentEvidence,
  governanceAssessment,
  manifestDocument,
  metricOptions,
  piiPolicies,
  platformEvidence,
  policyDecisions,
  qualityGates,
  releaseApprovalEvidence,
  seedIntake,
  seedRequest,
  sourceSystems,
  structuredSpec,
  testManagerCatalog,
  type ConsoleAuditEvent
} from "./seedData";

type ProductView = "new-request" | "build-plan" | "live-run" | "output-preview";
type SubmitState = "idle" | "loading" | "success" | "error";
type ApprovalState = "pending" | "approved" | "changes";
type ReleaseApprovalState = "pending" | "approved";
type PillTone = "neutral" | "success" | "warning" | "danger" | "info";

const checkingStatus: FactoryApiStatus = {
  mode: "checking",
  platformMode: "local-simulated",
  apiBaseUrl: "http://localhost:8787",
  label: "Checking Factory API",
  detail: "Connecting to the lifecycle service."
};

const productViews: Array<{ id: ProductView; label: string; icon: LucideIcon; helper: string }> = [
  { id: "new-request", label: "New Request", icon: MessageSquareText, helper: "Capture the ask" },
  { id: "build-plan", label: "Build Plan", icon: ShieldCheck, helper: "Review governance" },
  { id: "live-run", label: "Live Run", icon: Activity, helper: "Watch progress" },
  { id: "output-preview", label: "Output Preview", icon: LayoutDashboard, helper: "Inspect result" }
];

const runStages = [
  { id: "intake", label: "Request", status: "done", product: "Factory API" },
  { id: "governance", label: "Govern", status: "done", product: "UiPath Agents" },
  { id: "build", label: "Build", status: "active", product: "Codex worker" },
  { id: "quality", label: "Quality", status: "ready", product: "Test Manager" },
  { id: "release", label: "Release", status: "waiting", product: "Action Center" },
  { id: "preview", label: "Preview", status: "ready", product: "Sandbox" }
] as const;

const outputKpis = [
  { label: "Revenue", value: "$4.82M", delta: "+12.4%", tone: "success" },
  { label: "Repeat rate", value: "38.6%", delta: "+4.1%", tone: "success" },
  { label: "Return rate", value: "6.8%", delta: "-1.2%", tone: "info" },
  { label: "Risk accounts", value: "74", delta: "masked", tone: "warning" }
] as const;

export function App() {
  const [apiStatus, setApiStatus] = useState<FactoryApiStatus>(checkingStatus);
  const [snapshot, setSnapshot] = useState<LifecycleSnapshot | null>(null);
  const [view, setView] = useState<ProductView>(() => getInitialView());
  const [intake, setIntake] = useState<IntakeRequest>(seedIntake);
  const [request, setRequest] = useState(seedRequest);
  const [selectedSources, setSelectedSources] = useState(() => new Set(seedIntake.sourceSystems));
  const [selectedMetrics, setSelectedMetrics] = useState(() => new Set(metricOptions.map((metric) => metric.id)));
  const [selectedPolicy, setSelectedPolicy] = useState<(typeof piiPolicies)[number]>(piiPolicies[0]);
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(clarificationQuestions.map((question) => [question.id, question.defaultAnswer]))
  );
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [releaseApprovalState, setReleaseApprovalState] = useState<ReleaseApprovalState>("pending");
  const [auditLog, setAuditLog] = useState<ConsoleAuditEvent[]>(auditEvents);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

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

  useEffect(() => {
    if (apiStatus.mode !== "online") {
      return;
    }

    let mounted = true;

    async function refreshSnapshot() {
      const nextSnapshot = await getLifecycleSnapshot(request.id, apiStatus.apiBaseUrl);

      if (mounted) {
        setSnapshot(nextSnapshot);
      }
    }

    refreshSnapshot();
    const timer = window.setInterval(refreshSnapshot, 6_000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [apiStatus.apiBaseUrl, apiStatus.mode, request.id]);

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

  const selectedReadyCount = selectedSourceRecords.filter((source) => source.status !== "needs_mapping").length;
  const answeredCount = Object.values(answers).filter((answer) => answer.trim().length > 0).length;
  const canSubmit = intake.title.length >= 4 && intake.requesterEmail.includes("@") && intake.businessGoal.length >= 12;
  const apiTone: PillTone = apiStatus.mode === "online" ? "success" : apiStatus.mode === "checking" ? "info" : "warning";
  const lifecycleMode = snapshot ? "Live API snapshot" : apiStatus.mode === "online" ? "API connected" : "Local seed state";

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

  async function refreshApiStatus() {
    setApiStatus(checkingStatus);
    const nextStatus = await checkFactoryApi();
    setApiStatus(nextStatus);

    if (nextStatus.mode === "online") {
      setSnapshot(await getLifecycleSnapshot(request.id, nextStatus.apiBaseUrl));
    }
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
          : "Local lifecycle captured intake while Factory API endpoints are unavailable.",
        current.length + 1
      )
    ]);
    setSubmitState("success");
    setProductView("build-plan", setView);
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

  function approvePlan() {
    setApprovalState("approved");
    setAuditLog((current) => [
      ...current,
      createConsoleAudit("Scope approved in the console; build run is ready to start.", current.length + 1)
    ]);
    setProductView("live-run", setView);
  }

  function requestPlanChanges() {
    setApprovalState("changes");
    setAuditLog((current) => [
      ...current,
      createConsoleAudit("Reviewer requested plan changes before build handoff.", current.length + 1)
    ]);
  }

  const viewContent = {
    "new-request": (
      <RequestIntakeView
        answers={answers}
        answeredCount={answeredCount}
        canSubmit={canSubmit}
        intake={intake}
        lifecycleMode={lifecycleMode}
        onAnswerChange={(questionId, answer) =>
          setAnswers((current) => ({
            ...current,
            [questionId]: answer
          }))
        }
        onSubmit={submitIntake}
        onToggleMetric={toggleMetric}
        onToggleSource={toggleSource}
        onUpdateField={updateIntakeField}
        selectedMetricRecords={selectedMetricRecords}
        selectedMetrics={selectedMetrics}
        selectedPolicy={selectedPolicy}
        selectedReadyCount={selectedReadyCount}
        selectedSourceRecords={selectedSourceRecords}
        selectedSources={selectedSources}
        setSelectedPolicy={setSelectedPolicy}
        submitState={submitState}
      />
    ),
    "build-plan": (
      <BuildPlanView
        approvalState={approvalState}
        manifestPreview={manifestPreview}
        onApprove={approvePlan}
        onRequestChanges={requestPlanChanges}
        onViewRun={() => setProductView("live-run", setView)}
        selectedMetricRecords={selectedMetricRecords}
        selectedPolicy={selectedPolicy}
        selectedSourceRecords={selectedSourceRecords}
        specPreview={specPreview}
      />
    ),
    "live-run": (
      <LiveRunView
        approvalState={approvalState}
        auditLog={auditLog}
        onOpenEvidence={() => setEvidenceOpen(true)}
        onReleaseApprove={() => setReleaseApprovalState("approved")}
        onViewPreview={() => setProductView("output-preview", setView)}
        releaseApprovalState={releaseApprovalState}
        snapshot={snapshot}
      />
    ),
    "output-preview": (
      <OutputPreviewView
        onOpenEvidence={() => setEvidenceOpen(true)}
        onViewRun={() => setProductView("live-run", setView)}
        releaseApprovalState={releaseApprovalState}
        selectedMetricRecords={selectedMetricRecords}
      />
    )
  } satisfies Record<ProductView, ReactNode>;

  return (
    <main className="app-shell">
      <aside className="side-nav" aria-label="Agent Factory navigation">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <strong>Agent Factory</strong>
            <span>Governed build console</span>
          </div>
        </div>

        <nav className="nav-list">
          {productViews.map(({ id, label, icon: Icon, helper }) => (
            <button
              aria-current={view === id ? "page" : undefined}
              className="nav-item"
              key={id}
              type="button"
              onClick={() => setProductView(id, setView)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{helper}</small>
              </span>
              {view === id ? <ChevronRight size={16} aria-hidden="true" /> : null}
            </button>
          ))}
        </nav>

        <div className="side-status">
          <Pill tone={apiTone}>{apiStatus.platformMode}</Pill>
          <strong>{apiStatus.label}</strong>
          <span>{apiStatus.detail}</span>
          <small>{apiStatus.apiBaseUrl}</small>
        </div>

        <div className="platform-stack" aria-label="UiPath platform stack">
          {["Maestro", "Agents", "Action Center", "Data Service", "API Workflows", "Test Cloud"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </aside>

      <section className="product-shell">
        <header className="top-bar">
          <div className="search-control" aria-label="Search requests">
            <Search size={16} aria-hidden="true" />
            <span>Search requests, runs, approvals</span>
          </div>
          <div className="top-actions">
            <Pill tone={apiTone}>{apiStatus.mode === "online" ? "API online" : lifecycleMode}</Pill>
            <button className="icon-button" type="button" onClick={refreshApiStatus} aria-label="Refresh API status">
              {apiStatus.mode === "checking" ? (
                <Loader2 className="spin-icon" size={17} aria-hidden="true" />
              ) : (
                <RefreshCw size={17} aria-hidden="true" />
              )}
            </button>
            <button className="user-chip" type="button" aria-label="Current user">
              <User size={16} aria-hidden="true" />
              <span>Avery Morgan</span>
            </button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <h1>{productViews.find((item) => item.id === view)?.label}</h1>
            <p>{getViewSubtitle(view)}</p>
          </div>
          <button className="secondary-action" type="button" onClick={() => setEvidenceOpen(true)}>
            <PanelRightOpen size={17} aria-hidden="true" />
            Evidence
          </button>
        </section>

        {apiStatus.mode === "degraded" ? (
          <StatusBanner tone="warning" icon={AlertTriangle} title={apiStatus.label}>
            {apiStatus.detail}
          </StatusBanner>
        ) : null}

        {submitState === "success" ? (
          <StatusBanner tone="success" icon={CheckCircle2} title="Request captured">
            The plan, governance summary, run, and preview are synchronized to the current request state.
          </StatusBanner>
        ) : null}

        {submitState === "error" ? (
          <StatusBanner tone="danger" icon={XCircle} title="More detail needed">
            Title, requester email, and business goal are required before Agent Factory can start a request.
          </StatusBanner>
        ) : null}

        <div className="view-frame">{viewContent[view]}</div>
      </section>

      <EvidenceDrawer
        apiStatus={apiStatus}
        auditLog={auditLog}
        manifestPreview={manifestPreview}
        onClose={() => setEvidenceOpen(false)}
        open={evidenceOpen}
        snapshot={snapshot}
      />
    </main>
  );
}

function RequestIntakeView({
  answers,
  answeredCount,
  canSubmit,
  intake,
  lifecycleMode,
  onAnswerChange,
  onSubmit,
  onToggleMetric,
  onToggleSource,
  onUpdateField,
  selectedMetricRecords,
  selectedMetrics,
  selectedPolicy,
  selectedReadyCount,
  selectedSourceRecords,
  selectedSources,
  setSelectedPolicy,
  submitState
}: {
  answers: Record<string, string>;
  answeredCount: number;
  canSubmit: boolean;
  intake: IntakeRequest;
  lifecycleMode: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onToggleMetric: (metricId: string) => void;
  onToggleSource: (sourceId: string) => void;
  onUpdateField: (
    field: "title" | "requesterEmail" | "businessGoal" | "targetAudience" | "dueDate"
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  selectedMetricRecords: typeof metricOptions;
  selectedMetrics: Set<string>;
  selectedPolicy: (typeof piiPolicies)[number];
  selectedReadyCount: number;
  selectedSourceRecords: typeof sourceSystems;
  selectedSources: Set<string>;
  setSelectedPolicy: (policy: (typeof piiPolicies)[number]) => void;
  submitState: SubmitState;
}) {
  return (
    <div className="request-layout">
      <section className="primary-panel request-card">
        <PanelHeader
          action={<Pill tone={canSubmit ? "success" : "warning"}>{canSubmit ? "Ready" : "Needs detail"}</Pill>}
          icon={MessageSquareText}
          meta="Conversational intake"
          title="Tell Agent Factory what to build"
        />

        <div className="conversation-block">
          <div className="assistant-avatar">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <strong>I will turn this into a governed build plan.</strong>
            <p>
              Describe the business outcome, choose approved sources, and answer the few questions needed before
              the build worker receives a manifest.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field wide">
            <span>Request name</span>
            <input value={intake.title} onChange={onUpdateField("title")} />
          </label>
          <label className="field">
            <span>Requester</span>
            <input value={intake.requesterEmail} onChange={onUpdateField("requesterEmail")} />
          </label>
          <label className="field">
            <span>Target date</span>
            <input type="date" value={intake.dueDate ?? ""} onChange={onUpdateField("dueDate")} />
          </label>
          <label className="field wide">
            <span>Business outcome</span>
            <textarea rows={5} value={intake.businessGoal} onChange={onUpdateField("businessGoal")} />
          </label>
          <label className="field wide">
            <span>Audience</span>
            <input value={intake.targetAudience} onChange={onUpdateField("targetAudience")} />
          </label>
        </div>

        <div className="question-strip">
          {clarificationQuestions.map((question) => (
            <label className="question-row" key={question.id}>
              <span>
                <strong>{question.question}</strong>
                <small>{question.product}</small>
              </span>
              <textarea
                rows={2}
                value={answers[question.id] ?? ""}
                onChange={(event) => onAnswerChange(question.id, event.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="panel-actions">
          <button className="primary-action" disabled={submitState === "loading"} type="button" onClick={onSubmit}>
            {submitState === "loading" ? (
              <Loader2 className="spin-icon" size={17} aria-hidden="true" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
            {submitState === "loading" ? "Submitting" : "Generate build plan"}
          </button>
        </div>
      </section>

      <aside className="summary-rail">
        <SummaryCard icon={Workflow} label="Lifecycle" value={lifecycleMode} detail="Ready for real API state" tone="info" />
        <SummaryCard
          icon={Database}
          label="Sources"
          value={`${selectedReadyCount}/${selectedSources.size || 1} ready`}
          detail={`${selectedSourceRecords.length} selected`}
          tone={selectedReadyCount === selectedSourceRecords.length ? "success" : "warning"}
        />
        <SummaryCard
          icon={BarChart3}
          label="Metrics"
          value={`${selectedMetricRecords.length} selected`}
          detail="Governed KPI scope"
          tone="success"
        />
        <SummaryCard
          icon={MessageSquareText}
          label="Questions"
          value={`${answeredCount}/${clarificationQuestions.length}`}
          detail="Answered for planning"
          tone={answeredCount === clarificationQuestions.length ? "success" : "warning"}
        />

        <section className="rail-panel">
          <h2>Source access</h2>
          <div className="option-list">
            {sourceSystems.map((source) => (
              <button
                aria-pressed={selectedSources.has(source.id)}
                className="select-row"
                data-selected={selectedSources.has(source.id)}
                key={source.id}
                type="button"
                onClick={() => onToggleSource(source.id)}
              >
                <span>
                  <strong>{source.label}</strong>
                  <small>{source.owner}</small>
                </span>
                <Pill tone={source.status === "needs_mapping" ? "warning" : "success"}>{source.status.replaceAll("_", " ")}</Pill>
              </button>
            ))}
          </div>
        </section>

        <section className="rail-panel">
          <h2>Policy and metrics</h2>
          <label className="field">
            <span>PII policy</span>
            <select value={selectedPolicy} onChange={(event) => setSelectedPolicy(event.target.value as (typeof piiPolicies)[number])}>
              {piiPolicies.map((policy) => (
                <option key={policy}>{policy}</option>
              ))}
            </select>
          </label>
          <div className="check-list">
            {metricOptions.map((metric) => (
              <label className="check-row" key={metric.id}>
                <input checked={selectedMetrics.has(metric.id)} type="checkbox" onChange={() => onToggleMetric(metric.id)} />
                <span>
                  <strong>{metric.label}</strong>
                  <small>{metric.guardrail}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function BuildPlanView({
  approvalState,
  manifestPreview,
  onApprove,
  onRequestChanges,
  onViewRun,
  selectedMetricRecords,
  selectedPolicy,
  selectedSourceRecords,
  specPreview
}: {
  approvalState: ApprovalState;
  manifestPreview: typeof manifestDocument;
  onApprove: () => void;
  onRequestChanges: () => void;
  onViewRun: () => void;
  selectedMetricRecords: typeof metricOptions;
  selectedPolicy: string;
  selectedSourceRecords: typeof sourceSystems;
  specPreview: typeof structuredSpec;
}) {
  return (
    <div className="review-layout">
      <section className="primary-panel">
        <PanelHeader
          action={<Pill tone={approvalState === "approved" ? "success" : approvalState === "changes" ? "warning" : "info"}>{approvalCopy(approvalState)}</Pill>}
          icon={ShieldCheck}
          meta="Plan, policy, and human gates"
          title="Review the governed build plan"
        />

        <div className="review-steps" aria-label="Build plan review steps">
          {[
            ["Plan", "Template and output scope", "done"],
            ["Governance", "Data and policy checks", "done"],
            ["Approval", "Action Center gate", approvalState === "approved" ? "done" : "active"]
          ].map(([label, detail, status]) => (
            <div className="review-step" data-status={status} key={label}>
              <span>{status === "done" ? <Check size={15} aria-hidden="true" /> : <CircleDot size={15} aria-hidden="true" />}</span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </div>

        <div className="plan-grid">
          <section className="plain-section">
            <h2>Generated plan</h2>
            <p>{specPreview.objective}</p>
            <KeyValueList
              rows={[
                ["Template", buildManifest.template],
                ["Output", buildManifest.outputApp],
                ["Branch", buildManifest.branchName],
                ["Refresh", "Deterministic local data with visible timestamp"]
              ]}
            />
          </section>

          <section className="plain-section">
            <h2>Governance summary</h2>
            <div className="risk-block" data-risk={governanceAssessment.riskLevel}>
              <span>Risk tier</span>
              <strong>{governanceAssessment.riskLevel}</strong>
              <small>{governanceAssessment.requiresHumanApproval ? "Human approval required" : "Auto-approval allowed"}</small>
            </div>
            <div className="decision-list">
              {policyDecisions.map((decision) => (
                <div className="decision-row" key={decision.label}>
                  <span>{decision.label}</span>
                  <Pill tone={decision.severity}>{decision.value}</Pill>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="detail-columns">
          <ListBlock title="Selected sources" items={selectedSourceRecords.map((source) => `${source.label} - ${source.product}`)} />
          <ListBlock title="Approved metrics" items={selectedMetricRecords.map((metric) => `${metric.label} - ${metric.guardrail}`)} />
          <ListBlock title="Acceptance checks" items={specPreview.acceptanceCriteria} />
        </div>

        <div className="panel-actions">
          <button className="primary-action" type="button" onClick={approvalState === "approved" ? onViewRun : onApprove}>
            <UserCheck size={17} aria-hidden="true" />
            {approvalState === "approved" ? "Open live run" : "Approve plan"}
          </button>
          <button className="secondary-action" type="button" onClick={onRequestChanges}>
            <MessageSquareText size={17} aria-hidden="true" />
            Request changes
          </button>
        </div>
      </section>

      <aside className="summary-rail">
        <SummaryCard icon={LockKeyhole} label="PII policy" value={selectedPolicy} detail="Applied to generated app" tone="warning" />
        <SummaryCard icon={FileJson} label="Manifest" value={manifestPreview.manifest_hash} detail="Ready for worker handoff" tone="success" />
        <SummaryCard icon={UserCheck} label="Approval" value={approvalCopy(approvalState)} detail={releaseApprovalEvidence.approver} tone={approvalState === "approved" ? "success" : "warning"} />
        <section className="rail-panel">
          <h2>Platform route</h2>
          <KeyValueList
            rows={[
              ["Organization", defaultUiPathContext.organization],
              ["Tenant", defaultUiPathContext.tenant],
              ["Folder", defaultUiPathContext.folderName],
              ["Maestro", "Request-to-release"],
              ["Action Center", "Scope and release gates"]
            ]}
          />
        </section>
      </aside>
    </div>
  );
}

function LiveRunView({
  approvalState,
  auditLog,
  onOpenEvidence,
  onReleaseApprove,
  onViewPreview,
  releaseApprovalState,
  snapshot
}: {
  approvalState: ApprovalState;
  auditLog: ConsoleAuditEvent[];
  onOpenEvidence: () => void;
  onReleaseApprove: () => void;
  onViewPreview: () => void;
  releaseApprovalState: ReleaseApprovalState;
  snapshot: LifecycleSnapshot | null;
}) {
  const progress = releaseApprovalState === "approved" ? 86 : approvalState === "approved" ? 68 : 42;
  const currentStage = releaseApprovalState === "approved" ? "Sandbox preview is ready" : "Waiting on release approval";

  return (
    <div className="run-layout">
      <section className="primary-panel">
        <PanelHeader
          action={<Pill tone={snapshot ? "success" : "info"}>{snapshot ? "API snapshot" : "Seed-backed run"}</Pill>}
          icon={Activity}
          meta="Live run progress"
          title={currentStage}
        />

        <div className="run-progress">
          <div className="progress-line">
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong>{progress}% complete</strong>
          <small>{buildRunEvidence.buildRunId}</small>
        </div>

        <div className="stage-rail">
          {runStages.map((stage) => (
            <div className="stage-item" data-status={stage.status} key={stage.id}>
              <span>{stage.status === "done" ? <Check size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}</span>
              <strong>{stage.label}</strong>
              <small>{stage.product}</small>
            </div>
          ))}
        </div>

        <section className="active-stage">
          <div>
            <span className="stage-icon">
              <Rocket size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{currentStage}</h2>
              <p>
                The build is constrained to the approved manifest, quality evidence is linked, and release stays gated
                until the reviewer approves sandbox deployment.
              </p>
            </div>
          </div>
          <button className="primary-action" type="button" onClick={releaseApprovalState === "approved" ? onViewPreview : onReleaseApprove}>
            {releaseApprovalState === "approved" ? <ExternalLink size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
            {releaseApprovalState === "approved" ? "Open preview" : "Approve release"}
          </button>
        </section>

        <section className="log-panel">
          <div className="section-heading">
            <h2>Live activity</h2>
            <button type="button" onClick={onOpenEvidence}>
              <PanelRightOpen size={16} aria-hidden="true" />
              Evidence details
            </button>
          </div>
          <div className="log-stream">
            {buildLogEvents.map((event) => (
              <div className="log-row" data-level={event.level} key={event.id}>
                <span>{event.time}</span>
                <strong>{event.source}</strong>
                <p>{event.message}</p>
              </div>
            ))}
            {auditLog.slice(-3).map((event) => (
              <div className="log-row" data-level="info" key={event.id}>
                <span>{formatAuditTime(event.createdAt)}</span>
                <strong>{event.actor}</strong>
                <p>{event.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <aside className="summary-rail">
        <SummaryCard icon={GitBranch} label="Branch" value={buildRunEvidence.branchName} detail={buildRunEvidence.commitSha} tone="info" />
        <SummaryCard icon={FlaskConical} label="Quality gates" value="5 ready, 1 gated" detail={testManagerCatalog.testSetKey} tone="success" />
        <SummaryCard
          icon={ShieldCheck}
          label="Guardrails"
          value="Sandbox only"
          detail="No production deploy"
          tone="warning"
        />
        <SummaryCard
          icon={Rocket}
          label="Preview"
          value={releaseApprovalState === "approved" ? "Ready" : "Pending approval"}
          detail={deploymentEvidence.environment}
          tone={releaseApprovalState === "approved" ? "success" : "warning"}
        />
        <section className="rail-panel">
          <h2>Quality checks</h2>
          <div className="quality-list">
            {qualityGates.slice(0, 5).map((gate) => (
              <div className="quality-row" data-status={gate.status} key={gate.name}>
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>
                  <strong>{gate.name}</strong>
                  <small>{gate.testCaseKey ?? gate.provider}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function OutputPreviewView({
  onOpenEvidence,
  onViewRun,
  releaseApprovalState,
  selectedMetricRecords
}: {
  onOpenEvidence: () => void;
  onViewRun: () => void;
  releaseApprovalState: ReleaseApprovalState;
  selectedMetricRecords: typeof metricOptions;
}) {
  return (
    <div className="preview-layout">
      <section className="primary-panel preview-surface">
        <PanelHeader
          action={<Pill tone={releaseApprovalState === "approved" ? "success" : "warning"}>{deploymentEvidence.status}</Pill>}
          icon={LayoutDashboard}
          meta="Generated Customer360 dashboard"
          title="Customer360 preview"
        />

        <div className="preview-toolbar">
          <div>
            <strong>Privacy-safe sandbox data</strong>
            <span>Names, emails, and phone numbers are masked before rendering.</span>
          </div>
          <div className="segmented-control" aria-label="Preview filters">
            <button type="button" aria-pressed="true">30 days</button>
            <button type="button">Segment</button>
            <button type="button">Channel</button>
          </div>
        </div>

        <div className="kpi-grid">
          {outputKpis.map((kpi) => (
            <div className="kpi-card" data-tone={kpi.tone} key={kpi.label}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.delta}</small>
            </div>
          ))}
        </div>

        <div className="preview-grid">
          <section className="chart-panel">
            <h2>Revenue and retention</h2>
            <div className="bar-chart" aria-label="Revenue trend preview">
              {[54, 72, 66, 88, 78, 94, 82, 98].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </section>
          <section className="chart-panel">
            <h2>Customer behavior</h2>
            <div className="behavior-list">
              {["Expansion-ready accounts", "Support friction", "Return risk", "Healthy repeat buyers"].map((label, index) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{[42, 18, 9, 64][index]}%</strong>
                  <div>
                    <span style={{ width: `${[42, 18, 9, 64][index]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="masked-table">
          <div className="section-heading">
            <h2>Masked customer sample</h2>
            <button type="button" onClick={onOpenEvidence}>
              <ShieldCheck size={16} aria-hidden="true" />
              Governance
            </button>
          </div>
          {[
            ["CUST-1042", "Enterprise", "$214K", "Low", "Renewal health rising"],
            ["CUST-1188", "Mid-market", "$82K", "Medium", "Support friction watch"],
            ["CUST-1275", "Enterprise", "$341K", "Low", "Expansion candidate"]
          ].map(([customer, segment, revenue, risk, note]) => (
            <div className="table-row" key={customer}>
              <span>{customer}</span>
              <span>{segment}</span>
              <span>{revenue}</span>
              <Pill tone={risk === "Low" ? "success" : "warning"}>{risk}</Pill>
              <strong>{note}</strong>
            </div>
          ))}
        </section>
      </section>

      <aside className="summary-rail">
        <SummaryCard icon={Rocket} label="Sandbox" value={deploymentEvidence.environment} detail={deploymentEvidence.provider} tone="success" />
        <SummaryCard icon={LockKeyhole} label="Data mode" value="Masked synthetic" detail="No raw PII" tone="success" />
        <SummaryCard icon={BarChart3} label="Metric scope" value={`${selectedMetricRecords.length} KPIs`} detail="Generated from plan" tone="info" />
        <section className="rail-panel">
          <h2>Preview actions</h2>
          <div className="action-stack">
            <a className="primary-link" href={deploymentEvidence.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              Open sandbox preview
            </a>
            <button className="secondary-action" type="button" onClick={onViewRun}>
              <Activity size={16} aria-hidden="true" />
              Back to live run
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}

function EvidenceDrawer({
  apiStatus,
  auditLog,
  manifestPreview,
  onClose,
  open,
  snapshot
}: {
  apiStatus: FactoryApiStatus;
  auditLog: ConsoleAuditEvent[];
  manifestPreview: typeof manifestDocument;
  onClose: () => void;
  open: boolean;
  snapshot: LifecycleSnapshot | null;
}) {
  return (
    <aside className="evidence-drawer" aria-hidden={!open} data-open={open}>
      <div className="drawer-header">
        <div>
          <strong>Technical evidence</strong>
          <span>Runtime details for judges and operators</span>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close evidence drawer">
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="drawer-content">
        <section>
          <h2>API state</h2>
          <KeyValueList
            rows={[
              ["Mode", apiStatus.mode],
              ["Platform", apiStatus.platformMode],
              ["Base URL", apiStatus.apiBaseUrl],
              ["Snapshot", snapshot ? "loaded" : "seed fallback"]
            ]}
          />
        </section>

        <section>
          <h2>Build manifest</h2>
          <pre className="json-viewer">{JSON.stringify(manifestPreview, null, 2)}</pre>
        </section>

        <section>
          <h2>Audit timeline</h2>
          <AuditTable auditLog={auditLog} compact />
        </section>

        <section>
          <h2>Platform evidence</h2>
          <div className="platform-evidence-list">
            {platformEvidence.map((item) => (
              <div className="platform-evidence-row" data-status={item.status} key={item.product}>
                <span>
                  <strong>{item.product}</strong>
                  <small>{item.detail}</small>
                </span>
                <Pill tone={item.mode === "uipath-live" ? "success" : item.status === "pending" ? "warning" : "info"}>
                  {item.mode}
                </Pill>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function PanelHeader({
  action,
  icon: Icon,
  meta,
  title
}: {
  action?: ReactNode;
  icon: LucideIcon;
  meta: string;
  title: string;
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

function StatusBanner({
  children,
  icon: Icon,
  title,
  tone
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="status-banner" data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </div>
  );
}

function SummaryCard({
  detail,
  icon: Icon,
  label,
  tone,
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: PillTone;
  value: string;
}) {
  return (
    <div className="summary-card" data-tone={tone}>
      <Icon size={18} aria-hidden="true" />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </span>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: PillTone }) {
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

function ListBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="list-block">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuditTable({ auditLog, compact = false }: { auditLog: ConsoleAuditEvent[]; compact?: boolean }) {
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

function approvalCopy(state: ApprovalState) {
  if (state === "approved") {
    return "Approved";
  }

  if (state === "changes") {
    return "Changes requested";
  }

  return "Awaiting approval";
}

function getViewSubtitle(view: ProductView) {
  switch (view) {
    case "new-request":
      return "Start with a clear business request, approved sources, and a few bounded answers.";
    case "build-plan":
      return "Review the generated plan, data policy, approvals, and manifest before build handoff.";
    case "live-run":
      return "Watch the governed agentic run move through build, quality, release, and preview.";
    case "output-preview":
      return "Inspect the generated Customer360 dashboard and release evidence from the current run.";
  }
}

function getInitialView(): ProductView {
  if (typeof window === "undefined") {
    return "new-request";
  }

  const viewParam = new URLSearchParams(window.location.search).get("view");

  if (viewParam === "build-plan" || viewParam === "live-run" || viewParam === "output-preview") {
    return viewParam;
  }

  return "new-request";
}

function setProductView(view: ProductView, setView: (view: ProductView) => void) {
  setView(view);

  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  window.history.replaceState(null, "", url);
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
