const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?<![A-Za-z0-9])\+?\d[\d\s().-]{7,}\d\b/g;
const secretPatterns = [
  /\b(?:sk|fk|fw|lsv2|ghp|github_pat)_[A-Za-z0-9_=-]{12,}\b/g,
  /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\b/g
];

export interface RedactionResult {
  value: string;
  piiRedacted: boolean;
  secretsRedacted: boolean;
}

export interface RedactionFlags {
  piiRedacted: boolean;
  secretsRedacted: boolean;
}

export function redactText(value: string): RedactionResult {
  let piiRedacted = false;
  let secretsRedacted = false;
  let redacted = value;

  for (const pattern of secretPatterns) {
    redacted = redacted.replace(pattern, () => {
      secretsRedacted = true;
      return "[REDACTED_SECRET]";
    });
  }

  redacted = redacted.replace(emailPattern, () => {
    piiRedacted = true;
    return "[REDACTED_EMAIL]";
  });
  redacted = redacted.replace(phonePattern, () => {
    piiRedacted = true;
    return "[REDACTED_PHONE]";
  });

  return { value: redacted, piiRedacted, secretsRedacted };
}

export function redactPayload<T>(payload: T): { value: T; flags: RedactionFlags } {
  let piiRedacted = false;
  let secretsRedacted = false;

  function visit(value: unknown): unknown {
    if (typeof value === "string") {
      const result = redactText(value);
      piiRedacted = piiRedacted || result.piiRedacted;
      secretsRedacted = secretsRedacted || result.secretsRedacted;
      return result.value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => visit(item));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, visit(nestedValue)]));
    }

    return value;
  }

  return {
    value: visit(payload) as T,
    flags: { piiRedacted, secretsRedacted }
  };
}
