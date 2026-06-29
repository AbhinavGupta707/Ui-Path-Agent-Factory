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
import { defaultUiPathContext, type BuildRun, type IntakeRequest } from "@agent-factory/shared-contracts";
import {
  approveScope,
  checkFactoryApi,
  createBuildManifest,
  generateClarificationQuestions,
  generateGovernanceAssessment,
  generateStructuredSpec,
  getLifecycleSnapshot,
  queueBuildRun,
  recordSandboxDeployment,
  submitClarificationAnswers,
  submitIntakeToFactoryApi,
  updateBuildRunStatus,
  type DeploymentResult,
  type FactoryApiStatus,
  type LifecycleSnapshot
} from "./factoryClient";
import {
  auditEvents,
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
  type ClarificationQuestion,
  type ConsoleAuditEvent
} from "./seedData";

type ProductView = "new-request" | "build-plan" | "live-run" | "output-preview";
type SubmitState = "idle" | "loading" | "success" | "error";
type LifecycleBusyState = "idle" | "clarifying" | "planning" | "approving" | "deploying";
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
  const [activeQuestions, setActiveQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [lifecycleBusy, setLifecycleBusy] = useState<LifecycleBusyState>("idle");
  const [lifecycleIssue, setLifecycleIssue] = useState<string | null>(null);
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [releaseApprovalState, setReleaseApprovalState] = useState<ReleaseApprovalState>("pending");
  const [auditLog, setAuditLog] = useState<ConsoleAuditEvent[]>(auditEvents);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [buildRun, setBuildRun] = useState<BuildRun | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);

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

  useEffect(() => {
    const detail = snapshot?.detail;

    if (!detail) {
      return;
    }

    if (detail.clarificationQuestions.length > 0) {
      const nextQuestions = detail.clarificationQuestions.map((question) => ({
        id: question.id,
        question: question.question,
        product: question.source,
        defaultAnswer: question.default
      }));
      setActiveQuestions(nextQuestions);
      setAnswers((current) => ({
        ...Object.fromEntries(nextQuestions.map((question) => [question.id, question.defaultAnswer])),
        ...current
      }));
    }

    if (detail.buildRuns.length > 0) {
      setBuildRun(detail.buildRuns.at(-1) ?? null);
    }
  }, [snapshot]);

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
  const hasSubmittedRequest = submitState === "success" || request.id !== seedRequest.id;
  const allQuestionsAnswered = activeQuestions.length > 0 && answeredCount >= activeQuestions.length;
  const canSubmit = intake.title.length >= 4 && intake.requesterEmail.includes("@") && intake.businessGoal.length >= 12;
  const apiTone: PillTone = apiStatus.mode === "online" ? "success" : apiStatus.mode === "checking" ? "info" : "warning";
  const lifecycleMode = snapshot ? "Live API snapshot" : apiStatus.mode === "online" ? "API connected" : "Offline rehearsal";
  const currentBuildRun = buildRun ?? snapshot?.detail?.buildRuns.at(-1) ?? null;
  const deploymentUrl = deploymentResult?.deploymentUrl ?? deploymentEvidence.url;

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

    setLifecycleIssue(null);
    setLifecycleBusy("clarifying");
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

    if (apiRequest && apiStatus.mode === "online") {
      const clarification = await generateClarificationQuestions(nextRequest.id, apiStatus.apiBaseUrl);

      if (clarification.ok && clarification.data) {
        const generatedQuestions = clarification.data.questions;
        const nextQuestions = mapApiQuestionsToConsole(generatedQuestions);
        setActiveQuestions(nextQuestions);
        setAnswers(
          Object.fromEntries(nextQuestions.map((question) => [question.id, question.defaultAnswer]))
        );
        setAuditLog((current) => [
          ...current,
          createConsoleAudit(
            `Clarification Agent returned ${generatedQuestions.length} questions after intake submit.`,
            current.length + 1
          )
        ]);
      } else {
        setActiveQuestions([]);
        setAnswers({});
        setLifecycleIssue(
          "Request was created, but the clarification endpoint is unavailable. Live mode is blocked until /clarify succeeds."
        );
      }
    } else {
      setActiveQuestions(clarificationQuestions);
      setAnswers(Object.fromEntries(clarificationQuestions.map((question) => [question.id, question.defaultAnswer])));
      setLifecycleIssue(
        "Factory API is unavailable, so questions are shown in explicit offline rehearsal mode instead of live lifecycle mode."
      );
    }

    setSubmitState("success");
    setLifecycleBusy("idle");
  }

  async function generatePlanFromAnswers() {
    if (!allQuestionsAnswered) {
      setSubmitState("error");
      return;
    }

    setLifecycleIssue(null);
    setLifecycleBusy("planning");

    if (apiStatus.mode === "online") {
      const clarificationAnswers = activeQuestions.map((question) => ({
        question_id: question.id,
        answer: answers[question.id] ?? question.defaultAnswer,
        answered_by: intake.requesterEmail
      }));
      const answerResult = await submitClarificationAnswers(request.id, clarificationAnswers, apiStatus.apiBaseUrl);
      const specResult = answerResult.ok
        ? await generateStructuredSpec(request.id, apiStatus.apiBaseUrl)
        : ({ ok: false, action: "spec", message: answerResult.message } as const);
      const governanceResult = specResult.ok
        ? await generateGovernanceAssessment(request.id, apiStatus.apiBaseUrl)
        : ({ ok: false, action: "governance", message: specResult.message } as const);

      if (!answerResult.ok || !specResult.ok || !governanceResult.ok) {
        setLifecycleIssue(
          "The request has answers, but the live spec/governance lifecycle did not complete. Check Factory API configuration before approving scope."
        );
        setLifecycleBusy("idle");
        return;
      }

      setSnapshot(await getLifecycleSnapshot(request.id, apiStatus.apiBaseUrl));
      setAuditLog((current) => [
        ...current,
        createConsoleAudit("Answers, spec, and governance were generated through lifecycle endpoints.", current.length + 1)
      ]);
    } else {
      setAuditLog((current) => [
        ...current,
        createConsoleAudit("Offline rehearsal advanced to plan review with deterministic seed plan.", current.length + 1)
      ]);
    }

    setLifecycleBusy("idle");
    setProductView("build-plan", setView);
  }

  async function refreshClarificationQuestions() {
    setLifecycleIssue(null);
    setLifecycleBusy("clarifying");

    if (apiStatus.mode === "online") {
      const clarification = await generateClarificationQuestions(request.id, apiStatus.apiBaseUrl);

      if (clarification.ok && clarification.data) {
        const nextQuestions = mapApiQuestionsToConsole(clarification.data.questions);
        setActiveQuestions(nextQuestions);
        setAnswers((current) => ({
          ...Object.fromEntries(nextQuestions.map((question) => [question.id, current[question.id] ?? question.defaultAnswer]))
        }));
        setAuditLog((current) => [
          ...current,
          createConsoleAudit(`Refreshed ${nextQuestions.length} clarification questions.`, current.length + 1)
        ]);
      } else {
        setLifecycleIssue("Clarification refresh failed. Live mode remains blocked until /clarify succeeds.");
      }
    } else {
      setActiveQuestions(clarificationQuestions);
      setAnswers((current) => ({
        ...Object.fromEntries(clarificationQuestions.map((question) => [question.id, current[question.id] ?? question.defaultAnswer]))
      }));
      setLifecycleIssue("Offline rehearsal questions refreshed from deterministic seed state.");
    }

    setLifecycleBusy("idle");
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

  async function approvePlan() {
    setLifecycleIssue(null);
    setLifecycleBusy("approving");

    if (apiStatus.mode === "online") {
      const approvalResult = await approveScope(
        request.id,
        "Scope, data policy, and sandbox-only build approved from Factory Console.",
        apiStatus.apiBaseUrl
      );
      const manifestResult = approvalResult.ok
        ? await createBuildManifest(request.id, apiStatus.apiBaseUrl)
        : ({ ok: false, action: "manifest", message: approvalResult.message } as const);
      const buildResult =
        manifestResult.ok && manifestResult.data
          ? await queueBuildRun(request.id, manifestResult.data.manifest_id, apiStatus.apiBaseUrl)
          : ({ ok: false, action: "queue-build", message: manifestResult.message } as const);

      if (!approvalResult.ok || !manifestResult.ok || !buildResult.ok) {
        setLifecycleIssue(
          "Scope approval did not complete the live manifest/build queue chain. The run is blocked until those endpoints succeed."
        );
        setLifecycleBusy("idle");
        return;
      }

      if (buildResult.data) {
        setBuildRun(buildResult.data);
      }
      setSnapshot(await getLifecycleSnapshot(request.id, apiStatus.apiBaseUrl));
    }

    setApprovalState("approved");
    setAuditLog((current) => [
      ...current,
      createConsoleAudit("Scope approved; manifest and build queue handoff are ready for the run view.", current.length + 1)
    ]);
    setLifecycleBusy("idle");
    setProductView("live-run", setView);
  }

  function requestPlanChanges() {
    setApprovalState("changes");
    setAuditLog((current) => [
      ...current,
      createConsoleAudit("Reviewer requested plan changes before build handoff.", current.length + 1)
    ]);
  }

  async function approveRelease() {
    setLifecycleIssue(null);
    setLifecycleBusy("deploying");

    if (apiStatus.mode === "online" && currentBuildRun) {
      const readyResult = await updateBuildRunStatus(
        currentBuildRun.build_run_id,
        "awaiting_release_approval",
        apiStatus.apiBaseUrl
      );
      const deployResult = readyResult.ok
        ? await recordSandboxDeployment(request.id, currentBuildRun.build_run_id, deploymentEvidence.url, apiStatus.apiBaseUrl)
        : ({ ok: false, action: "deploy", message: readyResult.message } as const);

      if (!readyResult.ok || !deployResult.ok || !deployResult.data) {
        setLifecycleIssue(
          "Release approval was not recorded because build status or deployment evidence endpoint is unavailable."
        );
        setLifecycleBusy("idle");
        return;
      }

      setBuildRun(readyResult.data ?? currentBuildRun);
      setDeploymentResult(deployResult.data);
      setSnapshot(await getLifecycleSnapshot(request.id, apiStatus.apiBaseUrl));
    } else if (apiStatus.mode === "online" && !currentBuildRun) {
      setLifecycleIssue("No live build run is available yet. Approve the plan and queue the build before deployment.");
      setLifecycleBusy("idle");
      return;
    }

    setReleaseApprovalState("approved");
    setAuditLog((current) => [
      ...current,
      createConsoleAudit("Release approved; sandbox deployment evidence URL is attached to the run.", current.length + 1)
    ]);
    setLifecycleBusy("idle");
  }

  const viewContent = {
    "new-request": (
      <RequestIntakeView
        activeQuestions={activeQuestions}
        answers={answers}
        answeredCount={answeredCount}
        allQuestionsAnswered={allQuestionsAnswered}
        canSubmit={canSubmit}
        hasSubmittedRequest={hasSubmittedRequest}
        intake={intake}
        lifecycleBusy={lifecycleBusy}
        lifecycleIssue={lifecycleIssue}
        lifecycleMode={lifecycleMode}
        onAnswerChange={(questionId, answer) =>
          setAnswers((current) => ({
            ...current,
            [questionId]: answer
          }))
        }
        onContinue={generatePlanFromAnswers}
        onRefreshQuestions={refreshClarificationQuestions}
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
        lifecycleBusy={lifecycleBusy}
        lifecycleIssue={lifecycleIssue}
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
        buildRun={currentBuildRun}
        deploymentUrl={deploymentUrl}
        lifecycleIssue={lifecycleIssue}
        onOpenEvidence={() => setEvidenceOpen(true)}
        onReleaseApprove={approveRelease}
        onViewPreview={() => setProductView("output-preview", setView)}
        releaseApprovalState={releaseApprovalState}
        snapshot={snapshot}
      />
    ),
    "output-preview": (
      <OutputPreviewView
        deploymentUrl={deploymentUrl}
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
  activeQuestions,
  answers,
  answeredCount,
  allQuestionsAnswered,
  canSubmit,
  hasSubmittedRequest,
  intake,
  lifecycleBusy,
  lifecycleIssue,
  lifecycleMode,
  onAnswerChange,
  onContinue,
  onRefreshQuestions,
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
  activeQuestions: ClarificationQuestion[];
  answers: Record<string, string>;
  answeredCount: number;
  allQuestionsAnswered: boolean;
  canSubmit: boolean;
  hasSubmittedRequest: boolean;
  intake: IntakeRequest;
  lifecycleBusy: LifecycleBusyState;
  lifecycleIssue: string | null;
  lifecycleMode: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  onContinue: () => void;
  onRefreshQuestions: () => void;
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
  const questionCount = activeQuestions.length;

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
            <strong>{hasSubmittedRequest ? "A few details will shape the governed plan." : "Start with the business outcome."}</strong>
            <p>
              {hasSubmittedRequest
                ? "Clarification questions are generated after intake so the build manifest only includes approved scope."
                : "Describe the dashboard or automation you need. Agent Factory will create the request first, then ask only for missing facts."}
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

        {hasSubmittedRequest ? (
          <div className="question-strip" data-empty={questionCount === 0}>
            <div className="question-strip-header">
              <div>
                <strong>Clarifying questions</strong>
                <small>{questionCount > 0 ? "Generated after submit" : "Waiting for lifecycle response"}</small>
              </div>
              <Pill tone={allQuestionsAnswered ? "success" : "warning"}>
                {answeredCount}/{questionCount || 1} answered
              </Pill>
            </div>

            {lifecycleIssue ? (
              <StatusBanner tone="warning" icon={AlertTriangle} title="Lifecycle attention needed">
                {lifecycleIssue}
              </StatusBanner>
            ) : null}

            {questionCount > 0 ? (
              activeQuestions.map((question, index) => (
                <label className="question-row" key={question.id}>
                  <span>
                    <em>{index + 1}</em>
                    <strong>{question.question}</strong>
                    <small>{question.product}</small>
                  </span>
                  <textarea
                    rows={2}
                    value={answers[question.id] ?? ""}
                    onChange={(event) => onAnswerChange(question.id, event.target.value)}
                  />
                </label>
              ))
            ) : (
              <div className="empty-state">
                <Loader2 className={lifecycleBusy === "clarifying" ? "spin-icon" : undefined} size={18} aria-hidden="true" />
                <span>Submit succeeded, but no clarification questions are available yet.</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="panel-actions">
          {!hasSubmittedRequest ? (
            <button className="primary-action" disabled={submitState === "loading"} type="button" onClick={onSubmit}>
              {submitState === "loading" ? (
                <Loader2 className="spin-icon" size={17} aria-hidden="true" />
              ) : (
                <Send size={17} aria-hidden="true" />
              )}
              {submitState === "loading" ? "Submitting request" : "Submit request"}
            </button>
          ) : (
            <button
              className="primary-action"
              disabled={!allQuestionsAnswered || lifecycleBusy === "planning"}
              type="button"
              onClick={onContinue}
            >
              {lifecycleBusy === "planning" ? (
                <Loader2 className="spin-icon" size={17} aria-hidden="true" />
              ) : (
                <ShieldCheck size={17} aria-hidden="true" />
              )}
              {lifecycleBusy === "planning" ? "Generating plan" : "Generate build plan"}
            </button>
          )}
          {hasSubmittedRequest ? (
            <button
              className="secondary-action"
              type="button"
              onClick={onRefreshQuestions}
              disabled={lifecycleBusy === "clarifying"}
            >
              {lifecycleBusy === "clarifying" ? (
                <Loader2 className="spin-icon" size={17} aria-hidden="true" />
              ) : (
                <RefreshCw size={17} aria-hidden="true" />
              )}
              Refresh questions
            </button>
          ) : null}
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
          value={hasSubmittedRequest ? `${answeredCount}/${questionCount || 1}` : "After submit"}
          detail={hasSubmittedRequest ? "Answered for planning" : "Generated by lifecycle"}
          tone={allQuestionsAnswered ? "success" : "warning"}
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
  lifecycleBusy,
  lifecycleIssue,
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
  lifecycleBusy: LifecycleBusyState;
  lifecycleIssue: string | null;
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
          <button
            className="primary-action"
            disabled={lifecycleBusy === "approving"}
            type="button"
            onClick={approvalState === "approved" ? onViewRun : onApprove}
          >
            {lifecycleBusy === "approving" ? (
              <Loader2 className="spin-icon" size={17} aria-hidden="true" />
            ) : (
              <UserCheck size={17} aria-hidden="true" />
            )}
            {approvalState === "approved" ? "Open live run" : lifecycleBusy === "approving" ? "Approving scope" : "Approve plan"}
          </button>
          <button className="secondary-action" type="button" onClick={onRequestChanges}>
            <MessageSquareText size={17} aria-hidden="true" />
            Request changes
          </button>
        </div>

        {lifecycleIssue ? (
          <StatusBanner tone="warning" icon={AlertTriangle} title="Lifecycle attention needed">
            {lifecycleIssue}
          </StatusBanner>
        ) : null}
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
  buildRun,
  deploymentUrl,
  lifecycleIssue,
  onOpenEvidence,
  onReleaseApprove,
  onViewPreview,
  releaseApprovalState,
  snapshot
}: {
  approvalState: ApprovalState;
  auditLog: ConsoleAuditEvent[];
  buildRun: BuildRun | null;
  deploymentUrl: string;
  lifecycleIssue: string | null;
  onOpenEvidence: () => void;
  onReleaseApprove: () => void;
  onViewPreview: () => void;
  releaseApprovalState: ReleaseApprovalState;
  snapshot: LifecycleSnapshot | null;
}) {
  const progress = releaseApprovalState === "approved" ? 86 : approvalState === "approved" ? 68 : 42;
  const currentStage = releaseApprovalState === "approved" ? "Sandbox preview is ready" : "Waiting on release approval";
  const timeline = snapshot?.timeline ?? [];
  const activityEvents =
    timeline.length > 0
      ? timeline.slice(-7).map((event) => ({
          id: event.id,
          time: formatAuditTime(event.timestamp),
          source: event.actor,
          level: event.action.includes("failed") || event.action.includes("blocked") ? "warning" : "info",
          message: event.summary
        }))
      : buildLogEvents;
  const stageItems = [
    { id: "maestro", label: "Maestro", status: "done", product: "BPMN spine" },
    { id: "clarify", label: "Clarify", status: "done", product: "UiPath Agents" },
    { id: "action", label: "Human Gate", status: approvalState === "approved" ? "done" : "active", product: "Action Center" },
    { id: "workflow", label: "API Handoff", status: buildRun ? "done" : "ready", product: "API Workflow" },
    { id: "codex", label: "Build", status: buildRun ? "active" : "waiting", product: "Codex worker" },
    { id: "deploy", label: "Preview", status: releaseApprovalState === "approved" ? "done" : "waiting", product: "Sandbox" }
  ] as const;

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
          <small>{buildRun?.build_run_id ?? buildRunEvidence.buildRunId}</small>
        </div>

        <div className="stage-rail">
          {stageItems.map((stage) => (
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
          <button
            className="primary-action"
            type="button"
            onClick={releaseApprovalState === "approved" ? onViewPreview : onReleaseApprove}
          >
            {releaseApprovalState === "approved" ? <ExternalLink size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
            {releaseApprovalState === "approved" ? "Open preview" : "Approve release"}
          </button>
        </section>

        {lifecycleIssue ? (
          <StatusBanner tone="warning" icon={AlertTriangle} title="Lifecycle attention needed">
            {lifecycleIssue}
          </StatusBanner>
        ) : null}

        <section className="log-panel">
          <div className="section-heading">
            <h2>Live activity</h2>
            <button type="button" onClick={onOpenEvidence}>
              <PanelRightOpen size={16} aria-hidden="true" />
              Evidence details
            </button>
          </div>
          <div className="log-stream">
            {activityEvents.map((event) => (
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
          detail={releaseApprovalState === "approved" ? deploymentUrl : deploymentEvidence.environment}
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
  deploymentUrl,
  onOpenEvidence,
  onViewRun,
  releaseApprovalState,
  selectedMetricRecords
}: {
  deploymentUrl: string;
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
            <a className="primary-link" href={deploymentUrl} target="_blank" rel="noreferrer">
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

function mapApiQuestionsToConsole(
  questions: Array<{ id: string; question: string; default: string; source: string }>
): ClarificationQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    question: question.question,
    product: question.source,
    defaultAnswer: question.default
  }));
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
