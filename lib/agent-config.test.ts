import { describe, expect, test } from "bun:test";
import {
  DYNAMIC_RULE_LIMITS,
  defaultDynamicRulesConfig,
  normalizeDynamicRulesConfig,
  omitManagedAgentConfig,
  validateDynamicRulesConfig,
} from "./agent-config";

const source = "export function evaluate() { return null; }";

describe("dynamic agent-rule settings", () => {
  test("accepts a bounded valid rule configuration", () => {
    const config = defaultDynamicRulesConfig();
    config.enabled = true;
    config.rules = [{ name: "allow-health", language: "typescript", source }];

    expect(validateDynamicRulesConfig(config)).toEqual([]);
  });

  test("rejects duplicate names and oversized source", () => {
    const config = defaultDynamicRulesConfig();
    config.max_source_bytes = DYNAMIC_RULE_LIMITS.maxSourceBytes.min;
    config.rules = [
      { name: "duplicate", language: "javascript", source },
      {
        name: "duplicate",
        language: "typescript",
        source: "x".repeat(DYNAMIC_RULE_LIMITS.maxSourceBytes.min + 1),
      },
    ];

    const errors = validateDynamicRulesConfig(config);
    expect(errors.some((error) => error.includes("unique"))).toBe(true);
    expect(errors.some((error) => error.includes("source limit"))).toBe(true);
  });

  test("normalizes persisted values without retaining malformed rules", () => {
    const normalized = normalizeDynamicRulesConfig({
      enabled: true,
      max_rules: 1,
      rules: [
        { name: "", language: "typescript", source },
        { name: "valid", language: "js", source },
      ],
    });

    expect(normalized.enabled).toBe(true);
    expect(normalized.rules).toEqual([{ name: "valid", language: "javascript", source }]);
  });

  test("omits agent configuration from generic settings updates", () => {
    const agentConfig = { dynamic_rules: { enabled: true, rules: [] } };
    const update = omitManagedAgentConfig({
      _id: "settings-id",
      siteName: "NetGoat",
      agentConfig,
      pluginsConfigured: true,
      plugins: { installations: [] },
    });

    expect(update).toEqual({ _id: "settings-id", siteName: "NetGoat" });
    expect(agentConfig.dynamic_rules.enabled).toBe(true);
  });
});
