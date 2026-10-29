import type { TypedExpr } from "./ast";
import { parseExpression } from "./parser";
import { typecheck } from "./typechecker";
import type { Diagnostic } from "./diagnostics";

export interface AgentExpressionResult {
  expression?: string;
  diagnostics: Diagnostic[];
}

const FIELD_MAP: Record<string, string> = {
  "request.method": "method",
  "request.path": "path.normalized",
  "request.host": "host",
  "request.scheme": "scheme",
  "request.query": "query",
  "request.headers": "header",
  "request.body": "body.utf8",
  "request.size": "body.len",
  "client.ip": "ip",
  "tls.version": "tls.version",
};

function quote(value: string): string {
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error("Control characters in string literals are not supported by the edge runtime.");
  }
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function emit(node: TypedExpr): string {
  switch (node.kind) {
    case "error":
      throw new Error("Expression contains a syntax error.");
    case "literal":
      if (typeof node.value === "string") return quote(node.value);
      if (node.value === null) throw new Error("The edge runtime does not support null comparisons yet.");
      return String(node.value);
    case "field": {
      const mapped = FIELD_MAP[node.path];
      if (!mapped) throw new Error(`Field '${node.path}' is not available in the edge agent yet.`);
      return mapped;
    }
    case "dataset":
      throw new Error("Named datasets are not available in the edge agent yet.");
    case "unary":
      return `(not ${emit(node.operand)})`;
    case "index": {
      if (node.index.kind !== "literal" || typeof node.index.value !== "string") {
        throw new Error("The edge agent requires a literal header or query parameter name.");
      }
      const target = emit(node.target);
      const indexed = `${target}[${quote(node.index.value)}]`;
      return node.target.kind === "field" && node.target.path === "request.query"
        ? `${indexed}.urldecode`
        : indexed;
    }
    case "binary": {
      if (node.op === "and" || node.op === "or") {
        return `(${emit(node.left)} ${node.op} ${emit(node.right)})`;
      }
      const left = emit(node.left);
      const right = emit(node.right);
      if ((node.left.kind === "field" && node.left.path === "client.ip") ||
          (node.right.kind === "field" && node.right.path === "client.ip")) {
        if (node.op !== "in" && node.op !== "not in") {
          throw new Error("The edge runtime supports client.ip comparisons only with CIDR membership.");
        }
      }
      switch (node.op) {
        case "contains": return `${left} @contains ${right}`;
        case "starts_with": return `${left} @prefix ${right}`;
        case "ends_with": return `${left} @suffix ${right}`;
        case "matches": {
          if (node.right.kind !== "literal" || typeof node.right.value !== "string") {
            throw new Error("The edge agent requires a literal regular expression.");
          }
          if (node.right.value.includes("`") || /[\r\n]/.test(node.right.value)) {
            throw new Error("This regular expression cannot be represented by the edge runtime.");
          }
          return `${left} @rx \`${node.right.value}\``;
        }
        case "in":
          if (node.right.type !== "cidr") throw new Error("The edge agent currently supports 'in' only for a CIDR value.");
          return `${left} in ${right}`;
        case "not in":
          if (node.right.type !== "cidr") throw new Error("The edge agent currently supports 'not in' only for a CIDR value.");
          return `not (${left} in ${right})`;
        default:
          return `${left} ${node.op} ${right}`;
      }
    }
  }
}

/** Compile WAFL 1.0 condition syntax into the bounded expression subset accepted by NetGoat's Go edge agent. */
export function compileAgentExpression(source: string): AgentExpressionResult {
  const parsed = parseExpression(source);
  const checked = typecheck(parsed.expression);
  const diagnostics = [...parsed.diagnostics, ...checked.diagnostics];
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) return { diagnostics };
  try {
    return { expression: emit(checked.typed), diagnostics };
  } catch (error) {
    return {
      diagnostics: [
        ...diagnostics,
        {
          code: "EDGE_RUNTIME_UNSUPPORTED",
          severity: "error",
          message: error instanceof Error ? error.message : "Expression is unsupported by the edge runtime.",
          span: { start: 0, end: source.length },
        },
      ],
    };
  }
}
