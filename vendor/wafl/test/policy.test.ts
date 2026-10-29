import { describe, expect, test } from "bun:test";
import { compilePolicy, evaluatePolicy, rateLimitKey, simulatePolicy, type PolicyDocument } from "../src/policy";
import { UNKNOWN } from "../src/evaluator";

function basePolicy(overrides: Partial<PolicyDocument> = {}): PolicyDocument {
  return {
    name: "test",
    languageVersion: "1.0",
    enabled: true,
    mode: "enforce",
    defaultAction: "allow",
    rules: [],
    ...overrides,
  };
}

function compile(policy: PolicyDocument) {
  const result = compilePolicy(policy);
  const errors = result.diagnostics.filter((d) => d.severity === "error");
  expect(errors).toEqual([]);
  return result.policy!;
}

describe("policy compilation", () => {
  test("rejects duplicate rule ids", () => {
    const result = compilePolicy(basePolicy({
      rules: [
        { id: "r1", name: "a", enabled: true, priority: 1, expression: "true", action: { type: "block" } },
        { id: "r1", name: "b", enabled: true, priority: 2, expression: "false", action: { type: "block" } },
      ],
    }));
    expect(result.diagnostics.map((d) => d.code)).toContain("DUPLICATE_RULE_ID");
    expect(result.policy).toBeUndefined();
  });

  test("tags expression errors with the rule id", () => {
    const result = compilePolicy(basePolicy({
      rules: [
        { id: "rule_123", name: "bad", enabled: true, priority: 1, expression: "client.ip.reputaton == \"x\"", action: { type: "block" } },
      ],
    }));
    const diagnostic = result.diagnostics.find((d) => d.code === "UNKNOWN_FIELD");
    expect(diagnostic?.ruleId).toBe("rule_123");
    expect(diagnostic?.suggestion).toBe("client.ip.reputation");
  });

  test("rejects unsupported language versions", () => {
    const result = compilePolicy(basePolicy({ languageVersion: "2.0" as "1.0" }));
    expect(result.diagnostics.map((d) => d.code)).toContain("UNSUPPORTED_LANGUAGE_VERSION");
  });

  test("validates structured actions", () => {
    const result = compilePolicy(basePolicy({
      rules: [
        { id: "r1", name: "bad", enabled: true, priority: 1, expression: "true", action: { type: "redirect", status: 302, url: "javascript:alert(1)" } },
        { id: "r2", name: "bad", enabled: true, priority: 1, expression: "true", action: { type: "rate_limit", config: { limit: 0, windowMs: 0, key: ["client.ip"], exceedAction: "block" } } },
      ],
    }));
    expect(result.diagnostics.map((d) => d.code)).toContain("INVALID_REDIRECT_URL");
    expect(result.diagnostics.map((d) => d.code)).toContain("INVALID_ACTION_PARAM");
  });
});

describe("policy evaluation", () => {
  const sqliPolicy = basePolicy({
    rules: [
      { id: "r1", name: "Block SQLi", enabled: true, priority: 100, expression: "attack.sqli == true", action: { type: "block", status: 403 } },
    ],
  });

  test("terminal action stops evaluation", () => {
    const decision = evaluatePolicy(compile(sqliPolicy), { "attack.sqli": true });
    expect(decision.effect).toBe("block");
    expect(decision.enforced).toBe(true);
    expect(decision.matchedRules.map((r) => r.id)).toEqual(["r1"]);
  });

  test("falls back to the default action", () => {
    const decision = evaluatePolicy(compile(sqliPolicy), { "attack.sqli": false });
    expect(decision.effect).toBe("allow");
    expect(decision.action).toEqual({ type: "default", action: "allow" });
  });

  test("unknown never matches, even with a block default", () => {
    const policy = compile(basePolicy({
      defaultAction: "block",
      rules: [{ id: "r1", name: "sqli", enabled: true, priority: 1, expression: "attack.sqli == true", action: { type: "allow" } }],
    }));
    const decision = evaluatePolicy(policy, {});
    expect(decision.effect).toBe("block");
    expect(decision.action).toEqual({ type: "default", action: "block" });
  });

  test("log continues evaluation", () => {
    const policy = compile(basePolicy({
      rules: [
        { id: "log1", name: "log admin", enabled: true, priority: 200, expression: 'request.path starts_with "/admin"', action: { type: "log", event: "admin_access" } },
        { id: "block1", name: "block admin", enabled: true, priority: 100, expression: 'request.path starts_with "/admin"', action: { type: "block" } },
      ],
    }));
    const decision = evaluatePolicy(policy, { "request.path": "/admin/users" });
    expect(decision.effect).toBe("block");
    expect(decision.events.map((e) => e.event)).toEqual(["admin_access"]);
    expect(decision.matchedRules.map((r) => r.id)).toEqual(["log1", "block1"]);
  });

  test("orders by descending priority", () => {
    const policy = compile(basePolicy({
      rules: [
        { id: "allow1", name: "allow api", enabled: true, priority: 100, expression: 'request.path starts_with "/api"', action: { type: "allow" } },
        { id: "block1", name: "block api", enabled: true, priority: 200, expression: 'request.path starts_with "/api"', action: { type: "block" } },
      ],
    }));
    expect(evaluatePolicy(policy, { "request.path": "/api/x" }).effect).toBe("block");
  });

  test("breaks ties by ascending rule id", () => {
    const policy = compile(basePolicy({
      rules: [
        { id: "b", name: "b", enabled: true, priority: 100, expression: "true", action: { type: "block" } },
        { id: "a", name: "a", enabled: true, priority: 100, expression: "true", action: { type: "allow" } },
      ],
    }));
    expect(evaluatePolicy(policy, {}).effect).toBe("allow");
  });

  test("skips disabled rules and disabled policies", () => {
    const policy = compile(basePolicy({
      rules: [{ id: "r1", name: "off", enabled: false, priority: 1, expression: "true", action: { type: "block" } }],
    }));
    expect(evaluatePolicy(policy, {}).effect).toBe("allow");
    expect(evaluatePolicy({ ...policy, enabled: false }, {}).effect).toBe("allow");
  });

  test("simulation never enforces", () => {
    const policy = compile({ ...sqliPolicy, mode: "simulate" });
    const decision = evaluatePolicy(policy, { "attack.sqli": true });
    expect(decision.effect).toBe("block");
    expect(decision.enforced).toBe(false);
  });

  test("emits a rate-limit directive without counting", () => {
    const policy = compile(basePolicy({
      rules: [{
        id: "rl",
        name: "api limit",
        enabled: true,
        priority: 10,
        expression: 'request.path starts_with "/api"',
        action: { type: "rate_limit", config: { limit: 100, windowMs: 60000, key: ["client.ip", "request.path"], exceedAction: "block", status: 429 } },
      }],
    }));
    const decision = evaluatePolicy(policy, { "request.path": "/api/x", "client.ip": "203.0.113.9" });
    expect(decision.rateLimits).toHaveLength(1);
    expect(decision.rateLimits[0]!.key).toBe("203.0.113.9|/api/x");
    expect(decision.effect).toBe("allow");
  });

  test("rate limit key falls back for missing fields", () => {
    expect(rateLimitKey({ limit: 1, windowMs: 1, key: ["client.ip"], exceedAction: "block" }, {})).toBe("-");
  });

  test("simulatePolicy returns traces", () => {
    const results = simulatePolicy(compile(sqliPolicy), [
      { name: "attack", context: { "attack.sqli": true } },
      { name: "clean", context: { "attack.sqli": false } },
    ]);
    expect(results[0]!.decision.effect).toBe("block");
    expect(results[1]!.decision.effect).toBe("allow");
    expect(results[0]!.decision.trace).toBeDefined();
  });

  test("trace explains an unknown detector", () => {
    const decision = evaluatePolicy(compile(sqliPolicy), {}, { trace: true });
    const trace = decision.trace?.[0];
    expect(trace?.value).toBe("unknown");
    expect(trace?.reason).toBe("left_unknown");
  });

  test("UNKNOWN sentinel is not leaked into decisions", () => {
    const decision = evaluatePolicy(compile(sqliPolicy), {});
    expect(decision.effect).toBe("allow");
    expect(decision.effect).not.toBe(UNKNOWN);
  });
});
