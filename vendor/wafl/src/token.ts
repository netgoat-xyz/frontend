export interface Span {
  start: number;
  end: number;
}

export type TokenKind =
  | "ident"
  | "dataset"
  | "string"
  | "integer"
  | "number"
  | "duration"
  | "ip"
  | "cidr"
  | "true"
  | "false"
  | "null"
  | "and"
  | "or"
  | "not"
  | "in"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "matches"
  | "if"
  | "eq"
  | "ne"
  | "gt"
  | "ge"
  | "lt"
  | "le"
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "comma"
  | "eof";

export interface Token {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
  /** Parsed literal payload. */
  value?: string | number | boolean | null;
}

export const KEYWORDS: Readonly<Record<string, TokenKind>> = {
  and: "and",
  or: "or",
  not: "not",
  in: "in",
  contains: "contains",
  starts_with: "starts_with",
  ends_with: "ends_with",
  matches: "matches",
  if: "if",
  true: "true",
  false: "false",
  null: "null",
};

export function span(start: number, end: number): Span {
  return { start, end };
}
