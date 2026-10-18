/**
 * Dynamic rule configuration published to edge agents through
 * `Settings.agentConfig.dynamic_rules`.
 *
 * Field names and limits are a wire contract: agents poll this document and
 * compile the rules, so they must not drift. Everything here is
 * non-secret — the settings document is readable by agents by design.
 */

export const DYNAMIC_RULE_LIMITS = {
  maxRules: { min: 1, max: 64, default: 64 },
  maxSourceBytes: { min: 1024, max: 65536, default: 65536 },
  maxCompiledBytes: { min: 1024, max: 262144, default: 262144 },
  maxInputBytes: { min: 1024, max: 65536, default: 65536 },
  maxResultBytes: { min: 64, max: 4096, default: 4096 },
  maxExecutionMilliseconds: { min: 1, max: 500, default: 25 },
  maxRuleNameLength: 128,
  maxTotalSourceBytes: 49152,
} as const;

export type DynamicRuleLanguage = "typescript" | "javascript";

export type DynamicRule = {
  name: string;
  language: DynamicRuleLanguage;
  source: string;
};

export type DynamicRulesConfig = {
  enabled: boolean;
  rules: DynamicRule[];
  max_rules: number;
  max_source_bytes: number;
  max_compiled_bytes: number;
  max_input_bytes: number;
  max_result_bytes: number;
  max_execution_milliseconds: number;
};

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function defaultDynamicRulesConfig(): DynamicRulesConfig {
  return {
    enabled: false,
    rules: [],
    max_rules: DYNAMIC_RULE_LIMITS.maxRules.default,
    max_source_bytes: DYNAMIC_RULE_LIMITS.maxSourceBytes.default,
    max_compiled_bytes: DYNAMIC_RULE_LIMITS.maxCompiledBytes.default,
    max_input_bytes: DYNAMIC_RULE_LIMITS.maxInputBytes.default,
    max_result_bytes: DYNAMIC_RULE_LIMITS.maxResultBytes.default,
    max_execution_milliseconds: DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.default,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Clamps a number into a limit range, falling back to the default. */
function boundedInt(
  value: unknown,
  bounds: { min: number; max: number; default: number },
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return bounds.default;
  return Math.min(bounds.max, Math.max(bounds.min, Math.floor(value)));
}

/**
 * Produces a safe configuration from arbitrary stored input: unknown keys are
 * dropped, numbers are clamped, and unusable rules are discarded rather than
 * shipped to agents.
 */
export function normalizeDynamicRulesConfig(value: unknown): DynamicRulesConfig {
  const defaults = defaultDynamicRulesConfig();
  if (!isRecord(value)) return defaults;

  const maxRules = boundedInt(value.max_rules, DYNAMIC_RULE_LIMITS.maxRules);
  const maxSourceBytes = boundedInt(
    value.max_source_bytes,
    DYNAMIC_RULE_LIMITS.maxSourceBytes,
  );

  const rawRules = Array.isArray(value.rules) ? value.rules : [];
  const rules: DynamicRule[] = [];
  let totalSourceBytes = 0;

  for (const rawRule of rawRules) {
    if (rules.length >= maxRules) break;
    if (!isRecord(rawRule)) continue;

    const name = typeof rawRule.name === "string" ? rawRule.name.trim() : "";
    const source = typeof rawRule.source === "string" ? rawRule.source : "";

    if (!name || name.length > DYNAMIC_RULE_LIMITS.maxRuleNameLength) continue;
    if (/[\u0000-\u001f\u007f]/.test(name)) continue;
    if (!source || source.includes("\u0000")) continue;

    const sourceBytes = byteLength(source);
    if (sourceBytes > maxSourceBytes) continue;
    if (totalSourceBytes + sourceBytes > DYNAMIC_RULE_LIMITS.maxTotalSourceBytes) {
      continue;
    }
    totalSourceBytes += sourceBytes;

    const language =
      rawRule.language === "javascript" || rawRule.language === "js"
        ? "javascript"
        : "typescript";

    rules.push({ name, language, source });
  }

  return {
    enabled: value.enabled === true,
    rules,
    max_rules: maxRules,
    max_source_bytes: maxSourceBytes,
    max_compiled_bytes: boundedInt(
      value.max_compiled_bytes,
      DYNAMIC_RULE_LIMITS.maxCompiledBytes,
    ),
    max_input_bytes: boundedInt(
      value.max_input_bytes,
      DYNAMIC_RULE_LIMITS.maxInputBytes,
    ),
    max_result_bytes: boundedInt(
      value.max_result_bytes,
      DYNAMIC_RULE_LIMITS.maxResultBytes,
    ),
    max_execution_milliseconds: boundedInt(
      value.max_execution_milliseconds,
      DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds,
    ),
  };
}

/**
 * Strict validation used before persisting. Returns human-readable problems;
 * an empty array means the configuration can be published.
 */
export function validateDynamicRulesConfig(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) return ["Configuration must be an object."];
  if (typeof value.enabled !== "boolean") errors.push("`enabled` must be a boolean.");

  const numericFields: Array<{
    key: keyof DynamicRulesConfig;
    label: string;
    bounds: { min: number; max: number };
  }> = [
    { key: "max_rules", label: "Maximum rules", bounds: DYNAMIC_RULE_LIMITS.maxRules },
    {
      key: "max_source_bytes",
      label: "Maximum source bytes",
      bounds: DYNAMIC_RULE_LIMITS.maxSourceBytes,
    },
    {
      key: "max_compiled_bytes",
      label: "Maximum compiled bytes",
      bounds: DYNAMIC_RULE_LIMITS.maxCompiledBytes,
    },
    {
      key: "max_input_bytes",
      label: "Maximum input bytes",
      bounds: DYNAMIC_RULE_LIMITS.maxInputBytes,
    },
    {
      key: "max_result_bytes",
      label: "Maximum result bytes",
      bounds: DYNAMIC_RULE_LIMITS.maxResultBytes,
    },
    {
      key: "max_execution_milliseconds",
      label: "Maximum execution time",
      bounds: DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds,
    },
  ];

  for (const field of numericFields) {
    const raw = value[field.key];
    if (
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw < field.bounds.min ||
      raw > field.bounds.max
    ) {
      errors.push(
        `${field.label} must be a whole number between ${field.bounds.min} and ${field.bounds.max}.`,
      );
    }
  }

  if (!Array.isArray(value.rules)) {
    errors.push("`rules` must be an array.");
    return errors;
  }

  const maxRules =
    typeof value.max_rules === "number" ? value.max_rules : DYNAMIC_RULE_LIMITS.maxRules.default;
  const maxSourceBytes =
    typeof value.max_source_bytes === "number"
      ? value.max_source_bytes
      : DYNAMIC_RULE_LIMITS.maxSourceBytes.default;

  if (value.rules.length > maxRules) {
    errors.push(`At most ${maxRules} rules are allowed.`);
  }
  if (value.rules.length > DYNAMIC_RULE_LIMITS.maxRules.max) {
    errors.push(
      `At most ${DYNAMIC_RULE_LIMITS.maxRules.max} rules are supported by agents.`,
    );
  }

  const seenNames = new Set<string>();
  let totalSourceBytes = 0;

  value.rules.forEach((rule, index) => {
    const position = `Rule ${index + 1}`;
    if (!isRecord(rule)) {
      errors.push(`${position} must be an object.`);
      return;
    }

    const name = typeof rule.name === "string" ? rule.name.trim() : "";
    if (!name) {
      errors.push(`${position} needs a name.`);
    } else {
      if (name.length > DYNAMIC_RULE_LIMITS.maxRuleNameLength) {
        errors.push(
          `${position} name is longer than ${DYNAMIC_RULE_LIMITS.maxRuleNameLength} characters.`,
        );
      }
      if (/[\u0000-\u001f\u007f]/.test(name)) {
        errors.push(`${position} name contains control characters.`);
      }
      if (seenNames.has(name)) {
        errors.push(`Rule names must be unique — “${name}” appears twice.`);
      }
      seenNames.add(name);
    }

    if (rule.language !== "typescript" && rule.language !== "javascript") {
      errors.push(`${position} language must be TypeScript or JavaScript.`);
    }

    const source = typeof rule.source === "string" ? rule.source : "";
    if (!source.trim()) {
      errors.push(`${position} needs source code.`);
    } else if (source.includes("\u0000")) {
      errors.push(`${position} source contains null bytes.`);
    } else {
      const sourceBytes = byteLength(source);
      if (sourceBytes > maxSourceBytes) {
        errors.push(
          `${position} source is ${sourceBytes} bytes — the limit is ${maxSourceBytes}.`,
        );
      }
      totalSourceBytes += sourceBytes;
    }
  });

  if (totalSourceBytes > DYNAMIC_RULE_LIMITS.maxTotalSourceBytes) {
    errors.push(
      `Total rule source is ${totalSourceBytes} bytes — the combined budget is ${DYNAMIC_RULE_LIMITS.maxTotalSourceBytes}.`,
    );
  }

  return errors;
}

/**
 * Strips fields the settings form must never control: the agent config,
 * plugin snapshot and configured flag are managed by dedicated flows.
 */
export function omitManagedAgentConfig(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};

  const {
    agentConfig: _agentConfig,
    plugins: _plugins,
    pluginsConfigured: _pluginsConfigured,
    ...rest
  } = value;

  return rest;
}
