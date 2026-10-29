import type { Span } from "./token";

/**
 * Logical types. `string_map` is an internal indexable type used only for
 * `request.headers` and `request.query`; it is never a comparison operand.
 * `invalid` is a type-checker recovery marker and is never produced at runtime.
 */
export type ValueType =
  | "boolean"
  | "string"
  | "integer"
  | "number"
  | "ip"
  | "cidr"
  | "duration"
  | "string_set"
  | "ip_set"
  | "cidr_set"
  | "string_map"
  | "null"
  | "invalid";

export type LiteralValue = string | number | boolean | null;

export type BinaryOp =
  | "or"
  | "and"
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "starts_with"
  | "ends_with"
  | "matches"
  | "in"
  | "not in";

export interface LiteralExpr {
  kind: "literal";
  value: LiteralValue;
  literalType: ValueType;
  span: Span;
}

export interface FieldExpr {
  kind: "field";
  path: string;
  span: Span;
}

export interface DatasetExpr {
  kind: "dataset";
  name: string;
  span: Span;
}

export interface UnaryExpr {
  kind: "unary";
  op: "not";
  operand: Expr;
  span: Span;
}

export interface BinaryExpr {
  kind: "binary";
  op: BinaryOp;
  left: Expr;
  right: Expr;
  span: Span;
}

export interface IndexExpr {
  kind: "index";
  target: Expr;
  index: Expr;
  span: Span;
}

export interface ErrorExpr {
  kind: "error";
  span: Span;
}

export type Expr = LiteralExpr | FieldExpr | DatasetExpr | UnaryExpr | BinaryExpr | IndexExpr | ErrorExpr;

export interface TypedLiteral extends LiteralExpr {
  type: ValueType;
}
export interface TypedField extends FieldExpr {
  type: ValueType;
}
export interface TypedDataset extends DatasetExpr {
  type: ValueType;
}
export interface TypedUnary extends UnaryExpr {
  type: ValueType;
  operand: TypedExpr;
}
export interface TypedBinary extends BinaryExpr {
  type: ValueType;
  left: TypedExpr;
  right: TypedExpr;
}
export interface TypedIndex extends IndexExpr {
  type: ValueType;
  target: TypedExpr;
  index: TypedExpr;
}
export interface TypedError extends ErrorExpr {
  type: "invalid";
}

export type TypedExpr =
  | TypedLiteral
  | TypedField
  | TypedDataset
  | TypedUnary
  | TypedBinary
  | TypedIndex
  | TypedError;

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  key: Array<"client.ip" | "request.path" | "request.host">;
  exceedAction: "block" | "challenge";
  status?: number;
  burst?: number;
}

export type WAFAction =
  | { type: "allow" }
  | { type: "block"; status?: number }
  | { type: "challenge"; challenge: "managed" | "js" }
  | { type: "log"; event?: string }
  | { type: "redirect"; status: 301 | 302 | 307 | 308; url: string }
  | { type: "rate_limit"; config: RateLimitConfig };

export const TERMINAL_ACTIONS: ReadonlySet<WAFAction["type"]> = new Set([
  "allow",
  "block",
  "challenge",
  "redirect",
]);

export function isTerminal(action: WAFAction): boolean {
  return TERMINAL_ACTIONS.has(action.type);
}
