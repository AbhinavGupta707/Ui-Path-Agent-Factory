import { stat } from "node:fs/promises";
import path from "node:path";

export type EvidenceCheckStatus = "passed" | "failed" | "skipped" | "warning";

export interface EvidenceCheck {
  name: string;
  status: EvidenceCheckStatus;
  summary?: string;
  reportPath?: string;
}

export type ArtifactChangeType = "added" | "modified" | "deleted" | "renamed" | "copied" | "unmerged" | "unknown";

export type ArtifactKind = "source" | "test" | "documentation" | "configuration" | "data" | "deployment" | "other";

export interface ArtifactSourceFile {
  path: string;
  changeType?: ArtifactChangeType;
  additions?: number;
  deletions?: number;
}

export interface BuildArtifact {
  path: string;
  kind: ArtifactKind;
  changeType: ArtifactChangeType;
  reviewCategory: "generated-file" | "test-evidence" | "release-documentation" | "configuration-evidence";
  additions?: number;
  deletions?: number;
  sizeBytes?: number;
}

export interface ArtifactListOptions {
  workspaceRoot?: string;
}

const GENERATED_OUTPUT_DIRS = new Set([
  ".cache",
  ".next",
  ".parcel-cache",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "dist",
  "logs",
  "node_modules",
  "out",
  "playwright-report",
  "runs",
  "storybook-static",
  "test-results",
  "tmp",
  "temp"
]);

const LOCAL_LOG_NAMES = new Set(["npm-debug.log", "pnpm-debug.log", "yarn-debug.log", "yarn-error.log"]);

const SECRETISH_EXTENSIONS = new Set([".key", ".pem", ".p12", ".pfx"]);

const SECRETISH_NAME_PATTERN = /(^|[._-])(api-?key|credential|credentials|private-?key|secret|secrets|token|tokens)([._-]|$)/;

export function normalizeWorkspaceRelativePath(inputPath: string, workspaceRoot?: string): string | undefined {
  if (inputPath.includes("\0")) {
    return undefined;
  }

  let candidate = inputPath.trim();
  if (candidate.length === 0) {
    return undefined;
  }

  if (workspaceRoot && path.isAbsolute(candidate)) {
    const relative = path.relative(workspaceRoot, candidate);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return undefined;
    }
    candidate = relative;
  }

  if (path.isAbsolute(candidate)) {
    return undefined;
  }

  const normalized = path.posix.normalize(candidate.replaceAll(path.sep, "/").replaceAll("\\", "/"));
  if (normalized === "." || normalized.startsWith("../") || normalized === "..") {
    return undefined;
  }

  return normalized.replace(/^\.\//, "");
}

export function isSafeArtifactPath(inputPath: string, workspaceRoot?: string): boolean {
  const normalized = normalizeWorkspaceRelativePath(inputPath, workspaceRoot);
  if (!normalized) {
    return false;
  }

  const lower = normalized.toLowerCase();
  const segments = lower.split("/");
  const basename = segments.at(-1) ?? "";

  if (basename === ".env" || basename.startsWith(".env.")) {
    return false;
  }

  if (basename.endsWith(".log") || LOCAL_LOG_NAMES.has(basename)) {
    return false;
  }

  if (segments.some((segment) => GENERATED_OUTPUT_DIRS.has(segment))) {
    return false;
  }

  if (lower.startsWith(".uipath/.skills/") || lower === ".uipath/.skills") {
    return false;
  }

  if (lower.startsWith(".agents/skills/") || lower === ".agents/skills") {
    return false;
  }

  if (segments.some((segment) => SECRETISH_NAME_PATTERN.test(segment))) {
    return false;
  }

  if (SECRETISH_EXTENSIONS.has(path.posix.extname(lower))) {
    return false;
  }

  return true;
}

export async function createSafeArtifactList(
  files: Array<string | ArtifactSourceFile>,
  options: ArtifactListOptions = {}
): Promise<BuildArtifact[]> {
  const artifacts = new Map<string, BuildArtifact>();

  for (const file of files) {
    const source = typeof file === "string" ? { path: file } : file;
    const relativePath = normalizeWorkspaceRelativePath(source.path, options.workspaceRoot);
    if (!relativePath || !isSafeArtifactPath(relativePath)) {
      continue;
    }

    const artifact: BuildArtifact = {
      path: relativePath,
      kind: classifyArtifactKind(relativePath),
      changeType: source.changeType ?? "unknown",
      reviewCategory: classifyReviewCategory(relativePath),
      additions: source.additions,
      deletions: source.deletions
    };

    if (options.workspaceRoot && artifact.changeType !== "deleted") {
      const sizeBytes = await safeSizeBytes(path.join(options.workspaceRoot, relativePath));
      if (sizeBytes !== undefined) {
        artifact.sizeBytes = sizeBytes;
      }
    }

    artifacts.set(relativePath, artifact);
  }

  return [...artifacts.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export function classifyArtifactKind(inputPath: string): ArtifactKind {
  const normalized = normalizeWorkspaceRelativePath(inputPath);
  if (!normalized) {
    return "other";
  }

  const lower = normalized.toLowerCase();
  const extension = path.posix.extname(lower);

  if (lower.includes("/test/") || lower.includes("/tests/") || lower.endsWith(".test.ts") || lower.endsWith(".spec.ts")) {
    return "test";
  }

  if ([".md", ".mdx", ".txt"].includes(extension)) {
    return "documentation";
  }

  if ([".json", ".yml", ".yaml", ".toml"].includes(extension) || lower.endsWith("package.json")) {
    return "configuration";
  }

  if ([".csv", ".tsv", ".jsonl"].includes(extension) || lower.includes("/public/data/")) {
    return "data";
  }

  if (lower.includes("deploy") || lower.includes("release")) {
    return "deployment";
  }

  if ([".ts", ".tsx", ".js", ".jsx", ".css", ".html"].includes(extension)) {
    return "source";
  }

  return "other";
}

export function summarizeChecks(checks: EvidenceCheck[]): "passed" | "failed" | "warning" | "skipped" {
  if (checks.some((check) => check.status === "failed")) {
    return "failed";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  if (checks.length > 0 && checks.every((check) => check.status === "skipped")) {
    return "skipped";
  }

  return "passed";
}

function classifyReviewCategory(inputPath: string): BuildArtifact["reviewCategory"] {
  const kind = classifyArtifactKind(inputPath);
  if (kind === "test") {
    return "test-evidence";
  }

  if (kind === "documentation" || kind === "deployment") {
    return "release-documentation";
  }

  if (kind === "configuration") {
    return "configuration-evidence";
  }

  return "generated-file";
}

async function safeSizeBytes(filePath: string): Promise<number | undefined> {
  try {
    const stats = await stat(filePath);
    return stats.isFile() ? stats.size : undefined;
  } catch {
    return undefined;
  }
}
