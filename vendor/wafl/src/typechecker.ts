import fieldSchema from "../schema/fields.json";
import type {
  BinaryExpr,
  BinaryOp,
  Expr,
  TypedExpr,
  TypedIndex,
  TypedUnary,
  ValueType,
} from "./ast";
import { DiagnosticBag, closest, type Diagnostic } from "./diagnostics";
import { analyzeRegex } from "./regex";
import { parseCidr, parseIp } from "./values";

export interface FieldDefinition {
  path: string;
  type: ValueType;
  phase: "connection" | "request_line" | "request_headers" | "request_body";
  nullable: boolean;
  description: string;
}

export type DatasetType = "ip_set" | "string_set" | "cidr_set";

export interface DatasetDefinition {
  name: string;
  type: DatasetType;
}

export interface TypecheckOptions {
  datasets?: Record<string, DatasetDefinition>;
}

export const LANGUAGE_VERSION: string = fieldSchema.languageVersion;
export const FIELDS: readonly FieldDefinition[] = fieldSchema.fields as unknown as FieldDefinition[];
export const FIELD_MAP: ReadonlyMap<string, FieldDefinition> = new Map(FIELDS.map((f) => [f.path, f]));

const SET_TYPES: ReadonlySet<ValueType> = new Set(["string_set", "ip_set", "cidr_set", "string_map"]);

function isNumeric(type: ValueType): boolean {
  return type === "integer" || type === "number" || type === "duration";
}

function isComparable(left: ValueType, right: ValueType): boolean {
  if (left === "duration" || right === "duration") return left === "duration" && right === "duration";
  return (left === "integer" || left === "number") && (right === "integer" || right === "number");
}

function isStringLiteral(node: TypedExpr): node is TypedExpr & { kind: "literal"; value: string } {
  return node.kind === "literal" && node.literalType === "string" && typeof node.value === "string";
}

function coerceLiteral(node: TypedExpr, target: "ip" | "cidr"): TypedExpr | null {
  if (!isStringLiteral(node)) return null;
  if (target === "ip" && parseIp(node.value)) {
    return { ...node, type: "ip", literalType: "ip" };
  }
  if (target === "cidr" && parseCidr(node.value)) {
    return { ...node, type: "cidr", literalType: "cidr" };
  }
  return null;
}

function typeError(bag: DiagnosticBag, message: string, span: { start: number; end: number }): ValueType {
  bag.error("TYPE_MISMATCH", message, span);
  return "invalid";
}

function checkBinary(node: BinaryExpr, bag: DiagnosticBag, options: TypecheckOptions): TypedExpr {
  let left = check(node.left, bag, options);
  let right = check(node.right, bag, options);

  if (left.type === "ip" && isStringLiteral(right)) {
    const coerced = coerceLiteral(right, "ip");
    if (coerced) right = coerced;
    else bag.error("INVALID_IP", `'${right.value}' is not a valid IP address.`, right.span);
  }
  if (left.type === "cidr" && isStringLiteral(right)) {
    const coerced = coerceLiteral(right, "cidr");
    if (coerced) right = coerced;
    else bag.error("INVALID_CIDR", `'${right.value}' is not a valid CIDR block.`, right.span);
  }
  if (right.type === "ip" && isStringLiteral(left)) {
    const coerced = coerceLiteral(left, "ip");
    if (coerced) left = coerced;
  }
  if (right.type === "cidr" && isStringLiteral(left)) {
    const coerced = coerceLiteral(left, "cidr");
    if (coerced) left = coerced;
  }

  const type = resultType(node.op, left, right, node, bag);
  return { ...node, left, right, type };
}

function resultType(
  op: BinaryOp,
  left: TypedExpr,
  right: TypedExpr,
  node: Expr & { kind: "binary" },
  bag: DiagnosticBag,
): ValueType {
  const l = left.type;
  const r = right.type;
  if (l === "invalid" || r === "invalid") return "invalid";

  const mismatch = () => typeError(bag, `Operator '${op}' cannot be applied to ${l} and ${r}.`, node.span);

  if (op === "and" || op === "or") {
    if (l !== "boolean" || r !== "boolean") return mismatch();
    return "boolean";
  }

  if (op === "==" || op === "!=") {
    if (l === "null" && r === "null") {
      bag.warning("NULL_COMPARISON", "Comparing null to null is always true; did you mean a field comparison?", node.span);
      return "boolean";
    }
    if (l === "null" || r === "null") return "boolean";
    if (SET_TYPES.has(l) || SET_TYPES.has(r)) {
      return typeError(bag, `Operator '${op}' cannot compare collection types (${l}, ${r}).`, node.span);
    }
    if (l === r) return "boolean";
    if (isComparable(l, r)) return "boolean";
    return mismatch();
  }

  if (op === ">" || op === ">=" || op === "<" || op === "<=") {
    if (!isComparable(l, r)) {
      return typeError(bag, `Operator '${op}' requires two numbers or two durations, found ${l} and ${r}.`, node.span);
    }
    return "boolean";
  }

  if (op === "contains" || op === "starts_with" || op === "ends_with") {
    if (l !== "string" || r !== "string") {
      return typeError(bag, `Operator '${op}' requires two strings, found ${l} and ${r}.`, node.span);
    }
    return "boolean";
  }

  if (op === "matches") {
    if (l !== "string" || r !== "string") {
      return typeError(bag, `Operator 'matches' requires two strings, found ${l} and ${r}.`, node.span);
    }
    if (right.kind !== "literal" || typeof right.value !== "string") {
      bag.error(
        "REGEX_LITERAL_REQUIRED",
        "The right operand of 'matches' must be a string literal so the expression can be precompiled.",
        right.span,
      );
      return "invalid";
    }
    const check = analyzeRegex(right.value);
    if (!check.ok) {
      bag.error(check.code!, check.message!, right.span);
      return "invalid";
    }
    return "boolean";
  }

  if (op === "in" || op === "not in") {
    if (l === "ip" && (r === "ip_set" || r === "cidr_set" || r === "cidr")) return "boolean";
    if (l === "string" && r === "string_set") return "boolean";
    return typeError(
      bag,
      `Operator '${op}' cannot test ${l} against ${r}. Allowed: ip in ip_set/cidr_set/cidr, string in string_set.`,
      node.span,
    );
  }

  return mismatch();
}

function check(node: Expr, bag: DiagnosticBag, options: TypecheckOptions): TypedExpr {
  switch (node.kind) {
    case "error":
      return { ...node, type: "invalid" };

    case "literal":
      return { ...node, type: node.literalType };

    case "field": {
      const definition = FIELD_MAP.get(node.path);
      if (!definition) {
        bag.error("UNKNOWN_FIELD", `Unknown field: ${node.path}`, node.span, {
          suggestion: closest(node.path, FIELD_MAP.keys()),
        });
        return { ...node, type: "invalid" };
      }
      return { ...node, type: definition.type };
    }

    case "dataset": {
      const definition = options.datasets?.[node.name];
      if (!definition) {
        bag.error("UNKNOWN_DATASET", `Unknown dataset: $${node.name}`, node.span, {
          suggestion: closest(node.name, Object.keys(options.datasets ?? {})),
        });
        return { ...node, type: "invalid" };
      }
      return { ...node, type: definition.type };
    }

    case "unary": {
      const operand = check(node.operand, bag, options);
      const typed: TypedUnary = { ...node, operand, type: "boolean" };
      if (operand.type !== "invalid" && operand.type !== "boolean") {
        bag.error("TYPE_MISMATCH", `'not' requires a boolean, found ${operand.type}.`, node.span, {
          suggestion: "Wrap the comparison in parentheses: not (a == b)",
        });
        return { ...typed, type: "invalid" };
      }
      return typed;
    }

    case "index": {
      const target = check(node.target, bag, options);
      const index = check(node.index, bag, options);
      const typed: TypedIndex = { ...node, target, index, type: "string" };
      if (target.type !== "invalid" && target.type !== "string_map") {
        bag.error(
          "INVALID_OPERATOR_FOR_TYPE",
          `Only request.headers and request.query can be indexed; found ${target.type}.`,
          node.span,
        );
        return { ...typed, type: "invalid" };
      }
      if (index.type !== "invalid" && index.type !== "string") {
        bag.error("TYPE_MISMATCH", "Index expressions must be strings.", node.index.span);
        return { ...typed, type: "invalid" };
      }
      return typed;
    }

    case "binary":
      return checkBinary(node, bag, options);
  }
}

export interface TypecheckResult {
  typed: TypedExpr;
  diagnostics: Diagnostic[];
}

export function typecheck(expression: Expr, options: TypecheckOptions = {}): TypecheckResult {
  const bag = new DiagnosticBag();
  const typed = check(expression, bag, options);
  return { typed, diagnostics: bag.all };
}
