import type {
  BinaryOp,
  Expr,
  LiteralValue,
  RateLimitConfig,
  WAFAction,
} from "./ast";
import { DiagnosticBag, closest, type Diagnostic } from "./diagnostics";
import { tokenize, MAX_EXPRESSION_LENGTH } from "./lexer";
import type { Span, Token, TokenKind } from "./token";

export const MAX_NESTING_DEPTH = 64;

const PREC_OR = 1;
const PREC_AND = 2;
const PREC_COMPARE = 3;
const PREC_NOT = 4;

const ACTION_NAMES = ["allow", "block", "challenge", "log", "redirect", "rate_limit", "execute"] as const;
type ActionName = (typeof ACTION_NAMES)[number];

function binaryPrecedence(token: Token, next: Token): number | null {
  switch (token.kind) {
    case "or": return PREC_OR;
    case "and": return PREC_AND;
    case "eq":
    case "ne":
    case "gt":
    case "ge":
    case "lt":
    case "le":
    case "contains":
    case "starts_with":
    case "ends_with":
    case "matches":
    case "in":
      return PREC_COMPARE;
    case "not":
      return next.kind === "in" ? PREC_COMPARE : null;
    default:
      return null;
  }
}

function tokenToBinaryOp(token: Token): BinaryOp {
  switch (token.kind) {
    case "or": return "or";
    case "and": return "and";
    case "eq": return "==";
    case "ne": return "!=";
    case "gt": return ">";
    case "ge": return ">=";
    case "lt": return "<";
    case "le": return "<=";
    case "contains": return "contains";
    case "starts_with": return "starts_with";
    case "ends_with": return "ends_with";
    case "matches": return "matches";
    case "in": return "in";
    default: throw new Error(`not a binary operator: ${token.kind}`);
  }
}

function isComparison(op: BinaryOp): boolean {
  return op !== "and" && op !== "or";
}

class Parser {
  private position = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly diagnostics: DiagnosticBag,
    private readonly maxDepth = MAX_NESTING_DEPTH,
  ) {}

  peek(offset = 0): Token {
    return this.tokens[Math.min(this.position + offset, this.tokens.length - 1)]!;
  }

  next(): Token {
    const token = this.peek();
    if (token.kind !== "eof") this.position++;
    return token;
  }

  expect(kind: TokenKind, message: string): Token {
    const token = this.peek();
    if (token.kind === kind) return this.next();
    this.diagnostics.error("UNEXPECTED_TOKEN", message, { start: token.start, end: token.end });
    return token;
  }

  parseExpression(minPrecedence = 0, depth = 0): Expr {
    if (depth > this.maxDepth) {
      const token = this.peek();
      this.diagnostics.error(
        "NESTING_TOO_DEEP",
        `Expression nesting exceeds the limit of ${this.maxDepth}.`,
        { start: token.start, end: token.end },
      );
      return { kind: "error", span: { start: token.start, end: token.end } };
    }

    let left = this.parseUnary(depth);

    for (;;) {
      const token = this.peek();
      const precedence = binaryPrecedence(token, this.peek(1));
      if (precedence === null || precedence < minPrecedence) break;

      let op: BinaryOp;
      let opEnd: number;
      if (token.kind === "not") {
        this.next();
        const inToken = this.next();
        op = "not in";
        opEnd = inToken.end;
      } else {
        this.next();
        op = tokenToBinaryOp(token);
        opEnd = token.end;
      }

      if (left.kind === "binary" && isComparison(left.op) && isComparison(op)) {
        this.diagnostics.error(
          "CHAINED_COMPARISON",
          "Chained comparisons are ambiguous. Use parentheses and explicit 'and'.",
          { start: token.start, end: opEnd },
        );
      }

      const right = this.parseExpression(precedence + 1, depth + 1);
      left = {
        kind: "binary",
        op,
        left,
        right,
        span: { start: left.span.start, end: right.span.end },
      };
    }

    return left;
  }

  private parseUnary(depth: number): Expr {
    const token = this.peek();
    if (token.kind === "not") {
      this.next();
      const operand = this.parseExpression(PREC_NOT, depth + 1);
      return {
        kind: "unary",
        op: "not",
        operand,
        span: { start: token.start, end: operand.span.end },
      };
    }
    return this.parsePostfix(depth);
  }

  private parsePostfix(depth: number): Expr {
    let target = this.parsePrimary(depth);
    while (this.peek().kind === "lbracket") {
      const open = this.next();
      const index = this.parseExpression(0, depth + 1);
      const close = this.expect("rbracket", "Expected ']' after index expression.");
      target = {
        kind: "index",
        target,
        index,
        span: { start: target.span.start, end: close.kind === "rbracket" ? close.end : open.end },
      };
    }
    return target;
  }

  private parsePrimary(depth: number): Expr {
    const token = this.peek();

    switch (token.kind) {
      case "string":
        this.next();
        return { kind: "literal", value: token.value as string, literalType: "string", span: { start: token.start, end: token.end } };
      case "integer":
        this.next();
        return { kind: "literal", value: token.value as number, literalType: "integer", span: { start: token.start, end: token.end } };
      case "number":
        this.next();
        return { kind: "literal", value: token.value as number, literalType: "number", span: { start: token.start, end: token.end } };
      case "duration":
        this.next();
        return { kind: "literal", value: token.value as number, literalType: "duration", span: { start: token.start, end: token.end } };
      case "ip":
        this.next();
        return { kind: "literal", value: token.text, literalType: "ip", span: { start: token.start, end: token.end } };
      case "cidr":
        this.next();
        return { kind: "literal", value: token.text, literalType: "cidr", span: { start: token.start, end: token.end } };
      case "true":
        this.next();
        return { kind: "literal", value: true, literalType: "boolean", span: { start: token.start, end: token.end } };
      case "false":
        this.next();
        return { kind: "literal", value: false, literalType: "boolean", span: { start: token.start, end: token.end } };
      case "null":
        this.next();
        return { kind: "literal", value: null, literalType: "null", span: { start: token.start, end: token.end } };
      case "ident":
        this.next();
        return { kind: "field", path: token.text, span: { start: token.start, end: token.end } };
      case "dataset":
        this.next();
        return { kind: "dataset", name: (token.value as string) ?? token.text.slice(1), span: { start: token.start, end: token.end } };
      case "lparen": {
        this.next();
        const inner = this.parseExpression(0, depth + 1);
        this.expect("rparen", "Expected ')' to close the group.");
        return inner;
      }
      default:
        this.next();
        this.diagnostics.error(
          "UNEXPECTED_TOKEN",
          `Expected an expression, found ${token.kind === "eof" ? "end of input" : `'${token.text}'`}.`,
          { start: token.start, end: token.end },
        );
        return { kind: "error", span: { start: token.start, end: token.end } };
    }
  }
}

export interface ParseResult {
  expression: Expr;
  diagnostics: Diagnostic[];
}

export function parseExpression(source: string): ParseResult {
  const { tokens, diagnostics } = tokenize(source);
  const bag = new DiagnosticBag();
  for (const d of diagnostics) bag.push(d);

  const parser = new Parser(tokens, bag);
  const expression = parser.parseExpression();
  if (parser.peek().kind !== "eof") {
    const token = parser.peek();
    bag.error("UNEXPECTED_TOKEN", `Unexpected token '${token.text}' after expression.`, { start: token.start, end: token.end });
  }
  return { expression, diagnostics: bag.all };
}

export interface ParsedRule {
  action?: WAFAction;
  expression?: Expr;
  diagnostics: Diagnostic[];
}

function literalFromToken(token: Token): LiteralValue | undefined {
  if (token.kind === "string" || token.kind === "integer" || token.kind === "number" || token.kind === "duration") {
    return token.value as LiteralValue;
  }
  if (token.kind === "true") return true;
  if (token.kind === "false") return false;
  if (token.kind === "null") return null;
  return undefined;
}

function validateRedirectUrl(url: string): string | null {
  if (url.length > 2048) return "Redirect URL is longer than 2048 characters.";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Redirect URL must be an absolute URL.";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Redirect URL must use http or https.";
  }
  if (parsed.username || parsed.password) {
    return "Redirect URL must not contain credentials.";
  }
  if (parsed.hash) {
    return "Redirect URL must not contain a fragment.";
  }
  return null;
}

/** Parses the editor shorthand `action if condition` into structured data. */
export function parseRule(source: string): ParsedRule {
  const { tokens, diagnostics: lexDiagnostics } = tokenize(source);
  const bag = new DiagnosticBag();
  for (const d of lexDiagnostics) bag.push(d);

  const parser = new Parser(tokens, bag);
  const first = parser.peek();

  if (first.kind !== "ident") {
    bag.error("UNEXPECTED_TOKEN", "A rule must start with an action such as block or allow.", { start: first.start, end: first.end });
    return { diagnostics: bag.all };
  }

  const name = first.text as ActionName;
  if (!ACTION_NAMES.includes(name)) {
    bag.error("UNKNOWN_ACTION", `Unknown action '${name}'.`, { start: first.start, end: first.end }, {
      suggestion: closest(name, ACTION_NAMES),
    });
    return { diagnostics: bag.all };
  }
  parser.next();

  if (name === "execute") {
    bag.error(
      "UNSUPPORTED_ACTION",
      "'execute' is deliberately unsupported: WAFL policies cannot execute arbitrary code.",
      { start: first.start, end: first.end },
    );
    return { diagnostics: bag.all };
  }

  const args: Token[] = [];
  if (parser.peek().kind === "lparen") {
    parser.next();
    while (parser.peek().kind !== "rparen" && parser.peek().kind !== "eof") {
      args.push(parser.next());
      if (parser.peek().kind === "comma") parser.next();
      else break;
    }
    parser.expect("rparen", "Expected ')' after action parameters.");
  }

  const ifToken = parser.expect("if", "Expected 'if' between the action and the condition.");
  const expression = ifToken.kind === "if" ? parser.parseExpression() : undefined;
  if (parser.peek().kind !== "eof") {
    const token = parser.peek();
    bag.error("UNEXPECTED_TOKEN", `Unexpected token '${token.text}' after rule.`, { start: token.start, end: token.end });
  }

  const actionSpan: Span = { start: first.start, end: args.length > 0 ? (args[args.length - 1]?.end ?? first.end) : first.end };
  const action = buildAction(name, args, actionSpan, bag);

  return { action, expression, diagnostics: bag.all };
}

function buildAction(name: ActionName, args: Token[], span: Span, bag: DiagnosticBag): WAFAction | undefined {
  const noArgs = () => {
    if (args.length > 0) {
      bag.error("INVALID_ACTION_PARAM", `Action '${name}' does not accept parameters.`, span);
      return false;
    }
    return true;
  };

  switch (name) {
    case "allow":
      return noArgs() ? { type: "allow" } : undefined;

    case "block": {
      if (args.length === 0) return { type: "block" };
      const status = args[0]!.kind === "integer" ? (args[0]!.value as number) : NaN;
      if (args.length !== 1 || !Number.isInteger(status) || status < 400 || status > 599) {
        bag.error("INVALID_ACTION_PARAM", "block() accepts one status code between 400 and 599.", span);
        return undefined;
      }
      return { type: "block", status };
    }

    case "challenge": {
      if (args.length === 0) return { type: "challenge", challenge: "managed" };
      const token = args[0]!;
      const mode = token.kind === "string" ? (token.value as string) : token.text;
      if (args.length !== 1 || (mode !== "managed" && mode !== "js")) {
        bag.error("INVALID_ACTION_PARAM", "challenge() accepts 'managed' or 'js'.", span);
        return undefined;
      }
      return { type: "challenge", challenge: mode };
    }

    case "log": {
      if (args.length === 0) return { type: "log" };
      const event = args[0]!.kind === "string" ? (args[0]!.value as string) : undefined;
      if (args.length !== 1 || event === undefined || event.length > 64) {
        bag.error("INVALID_ACTION_PARAM", "log() accepts one string of at most 64 characters.", span);
        return undefined;
      }
      return { type: "log", event };
    }

    case "redirect": {
      const status = args[0]?.kind === "integer" ? (args[0]!.value as number) : NaN;
      const url = args[1]?.kind === "string" ? (args[1]!.value as string) : undefined;
      if (args.length !== 2 || ![301, 302, 307, 308].includes(status) || url === undefined) {
        bag.error("INVALID_ACTION_PARAM", "redirect() requires a status (301, 302, 307, 308) and a URL.", span);
        return undefined;
      }
      const problem = validateRedirectUrl(url);
      if (problem) {
        bag.error("INVALID_REDIRECT_URL", problem, span);
        return undefined;
      }
      return { type: "redirect", status: status as 301 | 302 | 307 | 308, url };
    }

    case "rate_limit": {
      const limit = args[0]?.kind === "integer" ? (args[0]!.value as number) : NaN;
      const windowMs = args[1]?.kind === "duration" ? (args[1]!.value as number) : NaN;
      if (args.length !== 2 || !Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1) {
        bag.error("INVALID_ACTION_PARAM", "rate_limit() requires a positive integer limit and a duration window, e.g. rate_limit(100, 1m).", span);
        return undefined;
      }
      const config: RateLimitConfig = {
        limit,
        windowMs,
        key: ["client.ip"],
        exceedAction: "block",
        status: 429,
      };
      return { type: "rate_limit", config };
    }

    default:
      return undefined;
  }
}

export { ACTION_NAMES, validateRedirectUrl, MAX_EXPRESSION_LENGTH };
