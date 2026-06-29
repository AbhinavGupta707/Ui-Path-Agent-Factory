const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN =
  /(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\w)/g;
const AUTHORIZATION_PATTERN =
  /\b(authorization\s*[:=]\s*(?:bearer|basic)?\s+)(["']?)[^\s"',}]+/gi;
const ENV_SECRET_PATTERN =
  /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|AUTH|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*(["']?)[^\s"',}]+/gi;
const KNOWN_TOKEN_PATTERN =
  /\b(?:sk-[A-Za-z0-9_-]{12,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g;
const HIGH_ENTROPY_PATTERN = /\b[A-Za-z0-9_-]{48,}\b/g;

export interface RedactionOptions {
  maxLength?: number;
}

export function redactSensitiveText(input: string, options: RedactionOptions = {}): string {
  const redacted = input
    .replace(AUTHORIZATION_PATTERN, "$1[REDACTED_SECRET]")
    .replace(ENV_SECRET_PATTERN, "$1=[REDACTED_SECRET]")
    .replace(KNOWN_TOKEN_PATTERN, "[REDACTED_TOKEN]")
    .replace(HIGH_ENTROPY_PATTERN, "[REDACTED_TOKEN]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(PHONE_PATTERN, "[REDACTED_PHONE]");

  if (options.maxLength !== undefined && redacted.length > options.maxLength) {
    return `${redacted.slice(0, options.maxLength)}... [truncated]`;
  }

  return redacted;
}

export function redactUnknownJson(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactUnknownJson(entry));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactUnknownJson(entry)])
    );
  }

  return value;
}
