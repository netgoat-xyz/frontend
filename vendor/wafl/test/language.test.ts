import { describe, expect, test } from "bun:test";
import { parseExpression, parseRule } from "../src/parser";
import { tokenize } from "../src/lexer";
import { typecheck } from "../src/typechecker";
import { evaluateExpression, UNKNOWN } from "../src/evaluator";
import type { BinaryExpr, UnaryExpr } from "../src/ast";
import type { DatasetDefinition } from "../src/typechecker";
import type { RuntimeDataset } from "../src/evaluator";

function checked(source: string, datasets: Record<string, DatasetDefinition> = {}) {
  const parsed = parseExpression(source);
  const result = typecheck(parsed.expression, { datasets });
  return { parsed, result };
}

function evaluate(source: string, context: Record<string, unknown> = {}, datasets: Record<string, RuntimeDataset> = {}) {
  const definitions: Record<string, DatasetDefinition> = {};
  for (const [name, dataset] of Object.entries(datasets)) definitions[name] = { name, type: dataset.type };
  const { parsed, result } = checked(source, definitions);
  expect(parsed.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return evaluateExpression(result.typed, context, { datasets, trace: true });
}

describe("lexer", () => {
  test("parses durations, ips, cidrs, strings, datasets", () => {
    const { tokens, diagnostics } = tokenize(
      'rate_limit(100, 1m) if client.ip in $trusted and request.path == "/x"',
    );
    expect(diagnostics).toEqual([]);
    const kinds = tokens.map((t) => t.kind);
    expect(kinds).toContain("duration");
    expect(kinds).toContain("dataset");
    expect(kinds).toContain("string");
  });

  test("rejects an unterminated string", () => {
    const { diagnostics } = tokenize('request.path == "abc');
    expect(diagnostics.map((d) => d.code)).toContain("UNTERMINATED_STRING");
  });

  test("rejects an invalid IPv4 literal", () => {
    const { diagnostics } = tokenize("client.ip == 999.1.1.1");
    expect(diagnostics.map((d) => d.code)).toContain("INVALID_IP");
  });
});

describe("parser", () => {
  test("and binds tighter than or", () => {
    const { expression, diagnostics } = parseExpression("a or b and c");
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const root = expression as BinaryExpr;
    expect(root.op).toBe("or");
    expect((root.right as BinaryExpr).op).toBe("and");
  });

  test("not binds tighter than comparison", () => {
    const { expression } = parseExpression("not a == b");
    const root = expression as BinaryExpr;
    expect(root.op).toBe("==");
    expect((root.left as UnaryExpr).op).toBe("not");
  });

  test("parses not in as one operator", () => {
    const { expression, diagnostics } = parseExpression("client.ip not in $trusted");
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect((expression as BinaryExpr).op).toBe("not in");
  });

  test("rejects chained comparisons", () => {
    const { diagnostics } = parseExpression('request.method == "GET" == "POST"');
    expect(diagnostics.map((d) => d.code)).toContain("CHAINED_COMPARISON");
  });

  test("parses rule shorthand into a structured action", () => {
    const rule = parseRule('block(403) if attack.sqli == true');
    expect(rule.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(rule.action).toEqual({ type: "block", status: 403 });
    expect(rule.expression?.kind).toBe("binary");
  });

  test("parses redirect and rate_limit shorthand", () => {
    expect(parseRule('redirect(301, "https://example.com/") if request.path == "/old"').action).toEqual({
      type: "redirect",
      status: 301,
      url: "https://example.com/",
    });
    expect(parseRule("rate_limit(100, 1m) if request.path starts_with \"/api\"").action).toEqual({
      type: "rate_limit",
      config: { limit: 100, windowMs: 60000, key: ["client.ip"], exceedAction: "block", status: 429 },
    });
  });

  test("rejects execute", () => {
    const rule = parseRule("execute if true");
    expect(rule.diagnostics.map((d) => d.code)).toContain("UNSUPPORTED_ACTION");
  });
});

describe("type checker", () => {
  test("suggests the closest field", () => {
    const { result } = checked('client.ip.reputaton == "bad"');
    const diagnostic = result.diagnostics.find((d) => d.code === "UNKNOWN_FIELD");
    expect(diagnostic?.suggestion).toBe("client.ip.reputation");
  });

  test("rejects comparing a string to an integer", () => {
    const { result } = checked("request.method > 3");
    expect(result.diagnostics.map((d) => d.code)).toContain("TYPE_MISMATCH");
  });

  test("rejects unknown datasets", () => {
    const { result } = checked("client.ip in $nope");
    expect(result.diagnostics.map((d) => d.code)).toContain("UNKNOWN_DATASET");
  });

  test("requires a literal regex", () => {
    const { result } = checked("request.path matches request.host");
    expect(result.diagnostics.map((d) => d.code)).toContain("REGEX_LITERAL_REQUIRED");
  });

  test("rejects unsafe regex constructs", () => {
    const { result } = checked('request.path matches "(a+)+"');
    expect(result.diagnostics.map((d) => d.code)).toContain("REGEX_UNSAFE");
  });

  test("accepts ip/string literal coercion", () => {
    const { result } = checked('client.ip == "1.2.3.4"');
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  test("rejects indexing a scalar", () => {
    const { result } = checked('request.method["x"] == "GET"');
    expect(result.diagnostics.map((d) => d.code)).toContain("INVALID_OPERATOR_FOR_TYPE");
  });
});

describe("evaluator", () => {
  test("three-valued logic", () => {
    expect(evaluate("attack.sqli == true", {}).value).toBe(UNKNOWN);
    expect(evaluate('attack.sqli == true and request.method == "POST"', { "request.method": "GET" }).value).toBe(false);
    expect(evaluate('attack.sqli == true and request.method == "GET"', { "request.method": "GET" }).value).toBe(UNKNOWN);
    expect(evaluate('attack.sqli == true or request.method == "GET"', { "request.method": "GET" }).value).toBe(true);
    expect(evaluate("not (attack.sqli == true)", {}).value).toBe(UNKNOWN);
  });

  test("explicit null differs from a missing field", () => {
    expect(evaluate("client.country == null", { "client.country": null }).value).toBe(true);
    expect(evaluate("client.country == null", {}).value).toBe(UNKNOWN);
  });

  test("ip and cidr matching", () => {
    expect(evaluate("client.ip in 10.0.0.0/8", { "client.ip": "10.9.8.7" }).value).toBe(true);
    expect(evaluate("client.ip in 10.0.0.0/8", { "client.ip": "11.0.0.1" }).value).toBe(false);
    expect(evaluate("client.ip in 2001:db8::/32", { "client.ip": "2001:db8:1::5" }).value).toBe(true);
    expect(evaluate('client.ip == "::1"', { "client.ip": "0:0:0:0:0:0:0:1" }).value).toBe(true);
  });

  test("dataset membership", () => {
    const trusted: RuntimeDataset = { type: "ip_set", values: ["192.168.1.5"] };
    expect(evaluate("client.ip in $trusted", { "client.ip": "192.168.1.5" }, { trusted }).value).toBe(true);
    expect(evaluate("client.ip in $trusted", { "client.ip": "192.168.1.6" }, { trusted }).value).toBe(false);

    // A dataset declared at compile time but absent at runtime is unknown,
    // never a silent non-match that could bypass a policy.
    const declared = checked("client.ip in $trusted", { trusted: { name: "trusted", type: "ip_set" } });
    expect(evaluateExpression(declared.result.typed, { "client.ip": "192.168.1.5" }).value).toBe(UNKNOWN);
  });

  test("string operations", () => {
    expect(evaluate('request.path starts_with "/api"', { "request.path": "/api/x" }).value).toBe(true);
    expect(evaluate('request.path ends_with ".php"', { "request.path": "/a.php" }).value).toBe(true);
    expect(evaluate('request.path contains "admin"', { "request.path": "/wp-admin/" }).value).toBe(true);
  });

  test("regex matching", () => {
    expect(evaluate('request.path matches "^/api/v[0-9]+/"', { "request.path": "/api/v2/x" }).value).toBe(true);
    expect(evaluate('request.path matches "^/api/v[0-9]+/"', { "request.path": "/api/beta/x" }).value).toBe(false);
  });

  test("header lookup is case-insensitive", () => {
    expect(evaluate('request.headers["user-agent"] contains "curl"', { "request.headers": { "User-Agent": "curl/8" } }).value).toBe(true);
  });

  test("unwraps detector signals and honours availability", () => {
    expect(evaluate("attack.sqli == true", { "attack.sqli": { value: true, confidence: 0.9 } }).value).toBe(true);
    expect(evaluate("attack.sqli == true", { "attack.sqli": { value: true, available: false } }).value).toBe(UNKNOWN);
  });

  test("produces a trace with a reason for unknown fields", () => {
    const result = evaluate("attack.sqli == true", {});
    expect(result.trace?.reason).toBe("left_unknown");
  });
});
