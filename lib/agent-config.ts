export type DynamicRuleLanguage = "typescript" | "javascript";

export interface DynamicRule {
  name: string;
  language: DynamicRuleLanguage;
  source: string;
}

export interface DynamicRulesConfig {
  enabled: boolean;
  rules: DynamicRule[];
  max_rules: number;
  max_source_bytes: number;
  max_compiled_bytes: number;
  max_input_bytes: number;
  max_result_bytes: number;
  max_execution_milliseconds: number;
}

export const DYNAMIC_RULE_LIMITS = {
  maxRules: { min: 1, max: 64, defaultValue: 64 },
  maxSourceBytes: { min: 1024, max: 64 * 1024, defaultValue: 64 * 1024 },
  maxCompiledBytes: { min: 1024, max: 256 * 1024, defaultValue: 256 * 1024 },
  maxInputBytes: { min: 1024, max: 64 * 1024, defaultValue: 64 * 1024 },
  maxResultBytes: { min: 64, max: 4 * 1024, defaultValue: 4 * 1024 },
  maxExecutionMilliseconds: { min: 1, max: 500, defaultValue: 25 },
  maxRuleNameLength: 128,
  maxTotalSourceBytes: 48 * 1024,
} as const;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Agent configuration is updated by dedicated, bounded admin actions. Generic
 * settings saves must leave it alone so an older dashboard render cannot
 * overwrite a newer agent snapshot.
 */
export function omitManagedAgentConfig(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key]) => key !== "agentConfig" && key !== "plugins" && key !== "pluginsConfigured",
    ),
  );
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function defaultDynamicRulesConfig(): DynamicRulesConfig {
  return {
    enabled: false,
    rules: [],
    max_rules: DYNAMIC_RULE_LIMITS.maxRules.defaultValue,
    max_source_bytes: DYNAMIC_RULE_LIMITS.maxSourceBytes.defaultValue,
    max_compiled_bytes: DYNAMIC_RULE_LIMITS.maxCompiledBytes.defaultValue,
    max_input_bytes: DYNAMIC_RULE_LIMITS.maxInputBytes.defaultValue,
    max_result_bytes: DYNAMIC_RULE_LIMITS.maxResultBytes.defaultValue,
    max_execution_milliseconds: DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.defaultValue,
  };
}

/**
 * Coerce persisted values into the precise, bounded shape the stream server
 * publishes. Call validateDynamicRulesConfig before accepting a user edit.
 */
export function normalizeDynamicRulesConfig(value: unknown): DynamicRulesConfig {
  const fallback = defaultDynamicRulesConfig();
  const raw = isRecord(value) ? value : {};
  const maxRules = boundedInteger(
    raw.max_rules,
    fallback.max_rules,
    DYNAMIC_RULE_LIMITS.maxRules.min,
    DYNAMIC_RULE_LIMITS.maxRules.max,
  );
  const maxSourceBytes = boundedInteger(
    raw.max_source_bytes,
    fallback.max_source_bytes,
    DYNAMIC_RULE_LIMITS.maxSourceBytes.min,
    DYNAMIC_RULE_LIMITS.maxSourceBytes.max,
  );
  const maxCompiledBytes = boundedInteger(
    raw.max_compiled_bytes,
    fallback.max_compiled_bytes,
    DYNAMIC_RULE_LIMITS.maxCompiledBytes.min,
    DYNAMIC_RULE_LIMITS.maxCompiledBytes.max,
  );
  const maxInputBytes = boundedInteger(
    raw.max_input_bytes,
    fallback.max_input_bytes,
    DYNAMIC_RULE_LIMITS.maxInputBytes.min,
    DYNAMIC_RULE_LIMITS.maxInputBytes.max,
  );
  const maxResultBytes = boundedInteger(
    raw.max_result_bytes,
    fallback.max_result_bytes,
    DYNAMIC_RULE_LIMITS.maxResultBytes.min,
    DYNAMIC_RULE_LIMITS.maxResultBytes.max,
  );
  const maxExecutionMilliseconds = boundedInteger(
    raw.max_execution_milliseconds,
    fallback.max_execution_milliseconds,
    DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.min,
    DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.max,
  );

  const rules: DynamicRule[] = [];
  let sourceBytes = 0;
  for (const value of Array.isArray(raw.rules) ? raw.rules : []) {
    if (rules.length >= maxRules) break;
    if (!isRecord(value)) continue;
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const source = typeof value.source === "string" ? value.source : "";
    const size = byteLength(source);
    if (
      !name ||
      name.length > DYNAMIC_RULE_LIMITS.maxRuleNameLength ||
      CONTROL_CHARACTERS.test(name) ||
      !source.trim() ||
      source.includes("\u0000") ||
      size > maxSourceBytes ||
      sourceBytes + size > DYNAMIC_RULE_LIMITS.maxTotalSourceBytes
    ) {
      continue;
    }

    rules.push({
      name,
      language: value.language === "javascript" || value.language === "js" ? "javascript" : "typescript",
      source,
    });
    sourceBytes += size;
  }

  return {
    enabled: raw.enabled === true,
    rules,
    max_rules: maxRules,
    max_source_bytes: maxSourceBytes,
    max_compiled_bytes: maxCompiledBytes,
    max_input_bytes: maxInputBytes,
    max_result_bytes: maxResultBytes,
    max_execution_milliseconds: maxExecutionMilliseconds,
  };
}

export function validateDynamicRulesConfig(value: unknown): string[] {
  if (!isRecord(value)) return ["Dynamic rules must be a configuration object."];

  const errors: string[] = [];
  const integerFields: Array<{
    key: keyof Omit<DynamicRulesConfig, "enabled" | "rules">;
    label: string;
    limits: { min: number; max: number };
  }> = [
    { key: "max_rules", label: "Maximum rules", limits: DYNAMIC_RULE_LIMITS.maxRules },
    { key: "max_source_bytes", label: "Maximum source bytes", limits: DYNAMIC_RULE_LIMITS.maxSourceBytes },
    { key: "max_compiled_bytes", label: "Maximum compiled bytes", limits: DYNAMIC_RULE_LIMITS.maxCompiledBytes },
    { key: "max_input_bytes", label: "Maximum request bytes", limits: DYNAMIC_RULE_LIMITS.maxInputBytes },
    { key: "max_result_bytes", label: "Maximum result bytes", limits: DYNAMIC_RULE_LIMITS.maxResultBytes },
    {
      key: "max_execution_milliseconds",
      label: "Maximum execution time",
      limits: DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds,
    },
  ];

  for (const field of integerFields) {
    const rawNumber = value[field.key];
    const number = typeof rawNumber === "number" ? rawNumber : Number.NaN;
    if (!Number.isInteger(number) || number < field.limits.min || number > field.limits.max) {
      errors.push(`${field.label} must be a whole number between ${field.limits.min.toLocaleString()} and ${field.limits.max.toLocaleString()}.`);
    }
  }

  if (typeof value.enabled !== "boolean") {
    errors.push("Dynamic rules enabled must be true or false.");
  }
  if (!Array.isArray(value.rules)) {
    return [...errors, "Rules must be a list."];
  }

  const maximumRules = typeof value.max_rules === "number"
    ? value.max_rules
    : DYNAMIC_RULE_LIMITS.maxRules.defaultValue;
  if (value.rules.length > maximumRules || value.rules.length > DYNAMIC_RULE_LIMITS.maxRules.max) {
    errors.push(`Add no more than ${Math.min(maximumRules, DYNAMIC_RULE_LIMITS.maxRules.max)} rules.`);
  }

  const maximumSourceBytes = typeof value.max_source_bytes === "number"
    ? value.max_source_bytes
    : DYNAMIC_RULE_LIMITS.maxSourceBytes.defaultValue;
  const names = new Set<string>();
  let totalSourceBytes = 0;
  for (const [index, rule] of value.rules.entries()) {
    if (!isRecord(rule)) {
      errors.push(`Rule ${index + 1} must be an object.`);
      continue;
    }
    const name = typeof rule.name === "string" ? rule.name.trim() : "";
    const source = typeof rule.source === "string" ? rule.source : "";
    if (!name || name.length > DYNAMIC_RULE_LIMITS.maxRuleNameLength || CONTROL_CHARACTERS.test(name)) {
      errors.push(`Rule ${index + 1} needs a readable name of at most ${DYNAMIC_RULE_LIMITS.maxRuleNameLength} characters.`);
    } else if (names.has(name)) {
      errors.push(`Rule names must be unique (duplicate: ${name}).`);
    } else {
      names.add(name);
    }
    if (rule.language !== "typescript" && rule.language !== "javascript") {
      errors.push(`Rule ${index + 1} must use TypeScript or JavaScript.`);
    }
    const sourceBytes = byteLength(source);
    if (!source.trim() || source.includes("\u0000")) {
      errors.push(`Rule ${index + 1} needs source code without null characters.`);
    } else if (sourceBytes > maximumSourceBytes) {
      errors.push(`Rule ${index + 1} exceeds its ${maximumSourceBytes.toLocaleString()} byte source limit.`);
    }
    totalSourceBytes += sourceBytes;
  }

  if (totalSourceBytes > DYNAMIC_RULE_LIMITS.maxTotalSourceBytes) {
    errors.push(`All rule source must stay within ${DYNAMIC_RULE_LIMITS.maxTotalSourceBytes.toLocaleString()} bytes.`);
  }

  return errors;
}
