import type { Span } from "./token";

/**
 * Stable diagnostic codes. These are part of the public contract: the
 * browser editor, the API validation response, and the SFT pipeline all
 * consume them. Never renumber or repurpose an existing code.
 */
export type DiagnosticCode =
  | "SYNTAX_ERROR"
  | "UNEXPECTED_TOKEN"
  | "UNTERMINATED_STRING"
  | "INVALID_ESCAPE"
  | "INVALID_NUMBER"
  | "INVALID_IP"
  | "INVALID_CIDR"
  | "INVALID_DURATION"
  | "EXPRESSION_TOO_LONG"
  | "NESTING_TOO_DEEP"
  | "CHAINED_COMPARISON"
  | "UNKNOWN_FIELD"
  | "UNKNOWN_DATASET"
  | "UNKNOWN_ACTION"
  | "UNSUPPORTED_ACTION"
  | "INVALID_ACTION_PARAM"
  | "INVALID_REDIRECT_URL"
  | "TYPE_MISMATCH"
  | "INVALID_OPERATOR_FOR_TYPE"
  | "REGEX_LITERAL_REQUIRED"
  | "INVALID_REGEX"
  | "REGEX_UNSAFE"
  | "REGEX_TOO_LONG"
  | "NULL_COMPARISON"
  | "DUPLICATE_RULE_ID"
  | "INVALID_POLICY"
  | "UNSUPPORTED_LANGUAGE_VERSION"
  | "EDGE_RUNTIME_UNSUPPORTED";

export type Severity = "error" | "warning";

export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  severity: Severity;
  span: Span;
  /** Present when the diagnostic is attached to a specific rule. */
  ruleId?: string;
  /** Machine-consumable fix hint, e.g. the corrected field name. */
  suggestion?: string;
}

export class DiagnosticBag {
  private readonly items: Diagnostic[] = [];

  error(code: DiagnosticCode, message: string, span: Span, extra?: Partial<Diagnostic>): void {
    this.items.push({ code, message, severity: "error", span, ...extra });
  }

  warning(code: DiagnosticCode, message: string, span: Span, extra?: Partial<Diagnostic>): void {
    this.items.push({ code, message, severity: "warning", span, ...extra });
  }

  push(d: Diagnostic): void {
    this.items.push(d);
  }

  get all(): Diagnostic[] {
    return this.items.slice();
  }

  get hasErrors(): boolean {
    return this.items.some((d) => d.severity === "error");
  }
}

/** Levenshtein distance, iterative, bounded by the input lengths. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length]!;
}

/** Returns the closest candidate within a conservative edit distance. */
export function closest(word: string, candidates: Iterable<string>): string | undefined {
  let best: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const d = levenshtein(word, candidate);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  if (best === undefined) return undefined;
  const threshold = Math.max(2, Math.floor(word.length * 0.34));
  return bestDistance <= threshold ? best : undefined;
}
