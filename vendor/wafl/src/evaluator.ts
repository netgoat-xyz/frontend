import type { BinaryOp, TypedBinary, TypedExpr, ValueType } from "./ast";
import { FIELD_MAP, type DatasetType } from "./typechecker";
import { formatIp, ipInCidr, parseCidr, parseDuration, parseIp } from "./values";

export const UNKNOWN: unique symbol = Symbol("unknown");
export type Unknown = typeof UNKNOWN;
export type Tri = boolean | Unknown;

export interface IpValue {
  kind: "ip";
  bytes: Uint8Array;
  text: string;
}

export interface CidrValue {
  kind: "cidr";
  bytes: Uint8Array;
  prefix: number;
  text: string;
}

export interface Signal {
  value: unknown;
  confidence?: number;
  source?: string;
  version?: string;
  available?: boolean;
}

export interface RuntimeDataset {
  type: DatasetType;
  version?: number;
  values: string[];
}

/** Canonical request context: a flat map keyed by field path. */
export type RequestContext = Record<string, unknown>;

export interface TraceNode {
  span: { start: number; end: number };
  op: string;
  value: "true" | "false" | "unknown";
  reason?: string;
  children?: TraceNode[];
}

export interface EvalOptions {
  trace?: boolean;
  datasets?: Record<string, RuntimeDataset>;
}

export interface EvalResult {
  value: Tri;
  trace?: TraceNode;
}

const MAX_MATCH_INPUT = 8192;

function hexKey(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function isIpValue(value: unknown): value is IpValue {
  return typeof value === "object" && value !== null && (value as IpValue).kind === "ip";
}

function isCidrValue(value: unknown): value is CidrValue {
  return typeof value === "object" && value !== null && (value as CidrValue).kind === "cidr";
}

function isSignal(raw: unknown, type: ValueType): raw is Signal {
  if (type === "string_map") return false;
  return typeof raw === "object" && raw !== null && !Array.isArray(raw) && !(raw instanceof Uint8Array) && "value" in raw;
}

interface Coerced {
  value: unknown | Unknown;
  reason?: string;
}

function coerce(raw: unknown, type: ValueType): Coerced {
  if (raw === null) return { value: null };
  if (raw === undefined) return { value: UNKNOWN, reason: "field_missing" };

  switch (type) {
    case "ip": {
      if (isIpValue(raw)) return { value: raw };
      if (typeof raw === "string") {
        const bytes = parseIp(raw);
        return bytes ? { value: { kind: "ip", bytes, text: formatIp(bytes) } } : { value: UNKNOWN, reason: "invalid_value" };
      }
      return { value: UNKNOWN, reason: "type_mismatch" };
    }
    case "cidr": {
      if (isCidrValue(raw)) return { value: raw };
      if (typeof raw === "string") {
        const cidr = parseCidr(raw);
        return cidr
          ? { value: { kind: "cidr", bytes: cidr.bytes, prefix: cidr.prefix, text: raw } }
          : { value: UNKNOWN, reason: "invalid_value" };
      }
      return { value: UNKNOWN, reason: "type_mismatch" };
    }
    case "duration": {
      if (typeof raw === "number" && Number.isFinite(raw)) return { value: raw };
      if (typeof raw === "string") {
        const ms = parseDuration(raw);
        return ms === null ? { value: UNKNOWN, reason: "invalid_value" } : { value: ms };
      }
      return { value: UNKNOWN, reason: "type_mismatch" };
    }
    case "boolean":
      return typeof raw === "boolean" ? { value: raw } : { value: UNKNOWN, reason: "type_mismatch" };
    case "integer":
      return typeof raw === "number" && Number.isInteger(raw) ? { value: raw } : { value: UNKNOWN, reason: "type_mismatch" };
    case "number":
      return typeof raw === "number" && Number.isFinite(raw) ? { value: raw } : { value: UNKNOWN, reason: "type_mismatch" };
    case "string":
      return typeof raw === "string" ? { value: raw } : { value: UNKNOWN, reason: "type_mismatch" };
    case "string_map":
      return typeof raw === "object" && raw !== null && !Array.isArray(raw) ? { value: raw } : { value: UNKNOWN, reason: "type_mismatch" };
    default:
      return { value: UNKNOWN, reason: "unsupported_type" };
  }
}

function resolveField(path: string, context: RequestContext): Coerced {
  const definition = FIELD_MAP.get(path);
  if (!definition) return { value: UNKNOWN, reason: "unknown_field" };

  const raw = context[path];
  if (raw === undefined) return { value: UNKNOWN, reason: "field_missing" };
  if (isSignal(raw, definition.type)) {
    if (raw.available === false) return { value: UNKNOWN, reason: "signal_unavailable" };
    return coerce(raw.value, definition.type);
  }
  return coerce(raw, definition.type);
}

function toTri(value: unknown): Tri {
  if (value === true) return true;
  if (value === false) return false;
  return UNKNOWN;
}

function triValue(value: Tri): "true" | "false" | "unknown" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

interface DatasetLookup {
  strings?: Set<string>;
  ips?: Set<string>;
  cidrs?: CidrValue[];
}

const datasetCache = new WeakMap<RuntimeDataset, DatasetLookup>();

function lookupFor(dataset: RuntimeDataset): DatasetLookup {
  let lookup = datasetCache.get(dataset);
  if (lookup) return lookup;
  lookup = {};
  if (dataset.type === "string_set") {
    lookup.strings = new Set(dataset.values);
  } else if (dataset.type === "ip_set") {
    const set = new Set<string>();
    for (const value of dataset.values) {
      const bytes = parseIp(value);
      if (bytes) set.add(hexKey(bytes));
    }
    lookup.ips = set;
  } else {
    const cidrs: CidrValue[] = [];
    for (const value of dataset.values) {
      const cidr = parseCidr(value);
      if (cidr) cidrs.push({ kind: "cidr", bytes: cidr.bytes, prefix: cidr.prefix, text: value });
    }
    lookup.cidrs = cidrs;
  }
  datasetCache.set(dataset, lookup);
  return lookup;
}

function membership(value: unknown, dataset: RuntimeDataset): Coerced {
  const lookup = lookupFor(dataset);
  if (dataset.type === "string_set") {
    return typeof value === "string"
      ? { value: lookup.strings!.has(value) }
      : { value: UNKNOWN, reason: "type_mismatch" };
  }
  if (!isIpValue(value)) return { value: UNKNOWN, reason: "type_mismatch" };
  if (dataset.type === "ip_set") return { value: lookup.ips!.has(hexKey(value.bytes)) };
  return { value: lookup.cidrs!.some((cidr) => ipInCidr(value.bytes, cidr)) };
}

function compareValues(op: BinaryOp, left: unknown, right: unknown): unknown | Unknown {
  if (left === UNKNOWN || right === UNKNOWN) return UNKNOWN;

  if (left === null || right === null) {
    if (op === "==") return left === right;
    if (op === "!=") return left !== right;
    return UNKNOWN;
  }

  const equal = (): boolean => {
    if (isIpValue(left) && isIpValue(right)) return hexKey(left.bytes) === hexKey(right.bytes);
    if (isCidrValue(left) && isCidrValue(right)) {
      return left.prefix === right.prefix && hexKey(left.bytes) === hexKey(right.bytes);
    }
    return left === right;
  };

  switch (op) {
    case "==": return equal();
    case "!=": return !equal();
    case ">":
    case ">=":
    case "<":
    case "<=": {
      if (typeof left !== "number" || typeof right !== "number") return UNKNOWN;
      if (op === ">") return left > right;
      if (op === ">=") return left >= right;
      if (op === "<") return left < right;
      return left <= right;
    }
    case "contains":
      return typeof left === "string" && typeof right === "string" ? left.includes(right) : UNKNOWN;
    case "starts_with":
      return typeof left === "string" && typeof right === "string" ? left.startsWith(right) : UNKNOWN;
    case "ends_with":
      return typeof left === "string" && typeof right === "string" ? left.endsWith(right) : UNKNOWN;
    default:
      return UNKNOWN;
  }
}

interface EvalEnv {
  context: RequestContext;
  datasets?: Record<string, RuntimeDataset>;
  trace: boolean;
  regexCache: Map<string, RegExp>;
}

interface NodeResult {
  value: unknown | Unknown;
  trace?: TraceNode;
}

function makeTrace(node: TypedExpr, value: unknown | Unknown, reason?: string, children?: TraceNode[]): TraceNode {
  return {
    span: node.span,
    op: node.kind === "binary" ? node.op : node.kind,
    value: triValue(toTri(value)),
    ...(reason ? { reason } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  };
}

function evalNode(node: TypedExpr, env: EvalEnv): NodeResult {
  switch (node.kind) {
    case "literal": {
      let value: unknown = node.value;
      if (node.literalType === "ip") {
        const bytes = parseIp(String(node.value));
        value = bytes ? { kind: "ip", bytes, text: formatIp(bytes) } : UNKNOWN;
      } else if (node.literalType === "cidr") {
        const cidr = parseCidr(String(node.value));
        value = cidr ? { kind: "cidr", bytes: cidr.bytes, prefix: cidr.prefix, text: String(node.value) } : UNKNOWN;
      }
      return { value, trace: env.trace ? makeTrace(node, value) : undefined };
    }

    case "field": {
      const resolved = resolveField(node.path, env.context);
      return {
        value: resolved.value,
        trace: env.trace ? makeTrace(node, resolved.value, resolved.reason) : undefined,
      };
    }

    case "dataset": {
      const dataset = env.datasets?.[node.name];
      return {
        value: dataset ?? UNKNOWN,
        trace: env.trace
          ? makeTrace(node, dataset ? true : UNKNOWN, dataset ? undefined : "dataset_unavailable")
          : undefined,
      };
    }

    case "index": {
      const target = evalNode(node.target, env);
      const index = evalNode(node.index, env);
      if (target.value === UNKNOWN || index.value === UNKNOWN || typeof index.value !== "string") {
        return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "index_unavailable") : undefined };
      }
      const map = target.value as Record<string, unknown>;
      let value: unknown;
      if (node.target.kind === "field" && node.target.path === "request.headers") {
        const wanted = index.value.toLowerCase();
        for (const key of Object.keys(map)) {
          if (key.toLowerCase() === wanted) {
            value = map[key];
            break;
          }
        }
      } else {
        value = map[index.value];
      }
      const resolved = value === undefined ? { value: UNKNOWN, reason: "field_missing" } : coerce(value, "string");
      return {
        value: resolved.value,
        trace: env.trace ? makeTrace(node, resolved.value, resolved.reason) : undefined,
      };
    }

    case "unary": {
      const operand = evalNode(node.operand, env);
      const tri = toTri(operand.value);
      const value = tri === UNKNOWN ? UNKNOWN : !tri;
      return {
        value,
        trace: env.trace ? makeTrace(node, value, undefined, operand.trace ? [operand.trace] : undefined) : undefined,
      };
    }

    case "binary":
      return evalBinary(node, env);

    case "error":
      return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "parse_error") : undefined };
  }
}

function evalBinary(node: TypedBinary, env: EvalEnv): NodeResult {
  const op = node.op;

  if (op === "and" || op === "or") {
    const left = evalNode(node.left, env);
    const leftTri = toTri(left.value);

    // Short-circuit only when the result is already determined.
    if (op === "and" && leftTri === false) {
      return { value: false, trace: env.trace ? makeTrace(node, false, "short_circuit", left.trace ? [left.trace] : undefined) : undefined };
    }
    if (op === "or" && leftTri === true) {
      return { value: true, trace: env.trace ? makeTrace(node, true, "short_circuit", left.trace ? [left.trace] : undefined) : undefined };
    }

    const right = evalNode(node.right, env);
    const rightTri = toTri(right.value);
    const value = op === "and"
      ? (leftTri === false || rightTri === false ? false : leftTri === UNKNOWN || rightTri === UNKNOWN ? UNKNOWN : true)
      : (leftTri === true || rightTri === true ? true : leftTri === UNKNOWN || rightTri === UNKNOWN ? UNKNOWN : false);

    const children = [left.trace, right.trace].filter((t): t is TraceNode => t !== undefined);
    return { value, trace: env.trace ? makeTrace(node, value, undefined, children) : undefined };
  }

  if (op === "in" || op === "not in") {
    const left = evalNode(node.left, env);
    if (left.value === UNKNOWN) {
      return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "left_unknown", left.trace ? [left.trace] : undefined) : undefined };
    }

    let matched: Coerced;
    if (node.right.kind === "dataset") {
      const dataset = env.datasets?.[node.right.name];
      matched = dataset ? membership(left.value, dataset) : { value: UNKNOWN, reason: "dataset_unavailable" };
    } else {
      const right = evalNode(node.right, env);
      if (right.value === UNKNOWN) {
        return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "right_unknown") : undefined };
      }
      matched = isCidrValue(right.value) && isIpValue(left.value)
        ? { value: ipInCidr(left.value.bytes, right.value) }
        : { value: false };
    }

    let value = matched.value;
    if (op === "not in" && value !== UNKNOWN) value = !value;
    return {
      value,
      trace: env.trace ? makeTrace(node, value, matched.reason, left.trace ? [left.trace] : undefined) : undefined,
    };
  }

  if (op === "matches") {
    const left = evalNode(node.left, env);
    const right = evalNode(node.right, env);
    if (left.value === UNKNOWN || right.value === UNKNOWN) {
      return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "operand_unknown") : undefined };
    }
    if (typeof left.value !== "string" || typeof right.value !== "string") {
      return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "type_mismatch") : undefined };
    }
    if (left.value.length > MAX_MATCH_INPUT) {
      return { value: UNKNOWN, trace: env.trace ? makeTrace(node, UNKNOWN, "input_too_long") : undefined };
    }
    let regex = env.regexCache.get(right.value);
    if (!regex) {
      regex = new RegExp(right.value, "u");
      env.regexCache.set(right.value, regex);
    }
    const value = regex.test(left.value);
    return { value, trace: env.trace ? makeTrace(node, value) : undefined };
  }

  const left = evalNode(node.left, env);
  const right = evalNode(node.right, env);
  const value = compareValues(op, left.value, right.value);
  const reason = left.value === UNKNOWN ? "left_unknown" : right.value === UNKNOWN ? "right_unknown" : undefined;
  const children = [left.trace, right.trace].filter((t): t is TraceNode => t !== undefined);
  return { value, trace: env.trace ? makeTrace(node, value, reason, children) : undefined };
}

export function evaluateExpression(expression: TypedExpr, context: RequestContext, options: EvalOptions = {}): EvalResult {
  const env: EvalEnv = {
    context,
    datasets: options.datasets,
    trace: options.trace ?? false,
    regexCache: new Map(),
  };
  const result = evalNode(expression, env);
  return { value: toTri(result.value), trace: result.trace };
}
