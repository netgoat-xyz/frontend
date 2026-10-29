import type { RateLimitConfig, TypedExpr, WAFAction } from "./ast";
import { isTerminal } from "./ast";
import { DiagnosticBag, type Diagnostic } from "./diagnostics";
import {
  evaluateExpression,
  type EvalOptions,
  type RequestContext,
  type RuntimeDataset,
  type TraceNode,
} from "./evaluator";
import { parseExpression, validateRedirectUrl } from "./parser";
import type { Span } from "./token";
import {
  typecheck,
  type TypecheckOptions,
} from "./typechecker";

export const SUPPORTED_LANGUAGE_VERSION = "1.0";

export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  expression: string;
  action: WAFAction;
  tags?: string[];
}

export interface PolicyDocument {
  name: string;
  language?: "wafl" | "gwl-x";
  languageVersion: "1.0";
  enabled: boolean;
  mode: "simulate" | "enforce";
  defaultAction: "allow" | "block";
  rules: PolicyRule[];
}

export interface CompiledRule extends Omit<PolicyRule, "expression"> {
  expression: TypedExpr;
}

export interface CompiledPolicy extends Omit<PolicyDocument, "rules"> {
  rules: CompiledRule[];
}

export interface CompileOptions extends TypecheckOptions {
  /** Attach a rule id to every diagnostic produced while compiling that rule. */
  tagRuleIds?: boolean;
}

export interface CompileResult {
  policy?: CompiledPolicy;
  diagnostics: Diagnostic[];
}

const RATE_LIMIT_KEYS = new Set(["client.ip", "request.path", "request.host"]);

export function validateAction(action: WAFAction, span: Span = { start: 0, end: 0 }): Diagnostic[] {
  const bag = new DiagnosticBag();

  switch (action.type) {
    case "allow":
      break;
    case "block":
      if (action.status !== undefined && (!Number.isInteger(action.status) || action.status < 400 || action.status > 599)) {
        bag.error("INVALID_ACTION_PARAM", "block status must be an integer between 400 and 599.", span);
      }
      break;
    case "challenge":
      if (action.challenge !== "managed" && action.challenge !== "js") {
        bag.error("INVALID_ACTION_PARAM", "challenge must be 'managed' or 'js'.", span);
      }
      break;
    case "log":
      if (action.event !== undefined && (typeof action.event !== "string" || action.event.length > 64)) {
        bag.error("INVALID_ACTION_PARAM", "log event must be a string of at most 64 characters.", span);
      }
      break;
    case "redirect": {
      if (![301, 302, 307, 308].includes(action.status)) {
        bag.error("INVALID_ACTION_PARAM", "redirect status must be 301, 302, 307, or 308.", span);
      }
      const problem = validateRedirectUrl(action.url);
      if (problem) bag.error("INVALID_REDIRECT_URL", problem, span);
      break;
    }
    case "rate_limit": {
      const config = action.config as RateLimitConfig;
      if (!Number.isInteger(config.limit) || config.limit < 1) {
        bag.error("INVALID_ACTION_PARAM", "rate_limit.limit must be a positive integer.", span);
      }
      if (!Number.isFinite(config.windowMs) || config.windowMs < 1) {
        bag.error("INVALID_ACTION_PARAM", "rate_limit.windowMs must be a positive duration.", span);
      }
      if (!Array.isArray(config.key) || config.key.length === 0) {
        bag.error("INVALID_ACTION_PARAM", "rate_limit.key must contain at least one key field.", span);
      } else {
        for (const key of config.key) {
          if (!RATE_LIMIT_KEYS.has(key)) {
            bag.error("INVALID_ACTION_PARAM", `Unsupported rate_limit key '${key}'.`, span);
          }
        }
      }
      if (config.exceedAction !== "block" && config.exceedAction !== "challenge") {
        bag.error("INVALID_ACTION_PARAM", "rate_limit.exceedAction must be 'block' or 'challenge'.", span);
      }
      if (config.status !== undefined && (!Number.isInteger(config.status) || config.status < 400 || config.status > 599)) {
        bag.error("INVALID_ACTION_PARAM", "rate_limit.status must be an integer between 400 and 599.", span);
      }
      break;
    }
    default:
      bag.error("UNSUPPORTED_ACTION", `Action '${(action as { type: string }).type}' is not supported.`, span);
  }

  return bag.all;
}

export function compilePolicy(policy: PolicyDocument, options: CompileOptions = {}): CompileResult {
  const bag = new DiagnosticBag();

  if (policy.languageVersion !== SUPPORTED_LANGUAGE_VERSION) {
    bag.error(
      "UNSUPPORTED_LANGUAGE_VERSION",
      `Unsupported language version '${policy.languageVersion}'; this build supports ${SUPPORTED_LANGUAGE_VERSION}.`,
      { start: 0, end: 0 },
    );
    return { diagnostics: bag.all };
  }

  if (policy.defaultAction !== "allow" && policy.defaultAction !== "block") {
    bag.error("INVALID_POLICY", "defaultAction must be 'allow' or 'block'.", { start: 0, end: 0 });
  }

  const seen = new Set<string>();
  const rules: CompiledRule[] = [];

  for (const rule of policy.rules) {
    if (seen.has(rule.id)) {
      bag.error("DUPLICATE_RULE_ID", `Duplicate rule id '${rule.id}'.`, { start: 0, end: 0 }, { ruleId: rule.id });
      continue;
    }
    seen.add(rule.id);

    if (!Number.isInteger(rule.priority)) {
      bag.error("INVALID_POLICY", `Rule '${rule.id}' priority must be an integer.`, { start: 0, end: 0 }, { ruleId: rule.id });
    }

    const parsed = parseExpression(rule.expression);
    const checked = typecheck(parsed.expression, options);

    for (const diagnostic of [...parsed.diagnostics, ...checked.diagnostics]) {
      bag.push(options.tagRuleIds === false ? diagnostic : { ...diagnostic, ruleId: rule.id });
    }

    for (const diagnostic of validateAction(rule.action)) {
      bag.push(options.tagRuleIds === false ? diagnostic : { ...diagnostic, ruleId: rule.id });
    }

    rules.push({ ...rule, expression: checked.typed });
  }

  if (bag.hasErrors) return { diagnostics: bag.all };

  return {
    policy: { ...policy, rules },
    diagnostics: bag.all,
  };
}

export interface MatchedRule {
  id: string;
  name: string;
  action: WAFAction;
}

export interface SecurityEvent {
  ruleId: string;
  ruleName: string;
  action: WAFAction;
  event?: string;
}

export interface RateLimitDirective {
  key: string;
  config: RateLimitConfig;
}

export type PolicyEffect = "allow" | "block" | "challenge" | "redirect" | "log" | "rate_limit";

export interface PolicyDecision {
  effect: PolicyEffect;
  action: WAFAction | { type: "default"; action: "allow" | "block" };
  /** True only when the policy is in enforce mode; simulation never enforces. */
  enforced: boolean;
  matchedRules: MatchedRule[];
  events: SecurityEvent[];
  rateLimits: RateLimitDirective[];
  trace?: TraceNode[];
}

function defaultDecision(policy: CompiledPolicy): PolicyDecision {
  return {
    effect: policy.defaultAction,
    action: { type: "default", action: policy.defaultAction },
    enforced: policy.mode === "enforce",
    matchedRules: [],
    events: [],
    rateLimits: [],
  };
}

function keyPart(path: string, context: RequestContext): string {
  const raw = context[path];
  if (raw === undefined || raw === null) return "-";
  if (typeof raw === "object" && "value" in raw) {
    const value = (raw as { value: unknown }).value;
    return value === undefined || value === null ? "-" : String(value);
  }
  return String(raw);
}

export function rateLimitKey(config: RateLimitConfig, context: RequestContext): string {
  return config.key.map((key) => keyPart(key, context)).join("|");
}

/**
 * Evaluates a compiled policy. Rules run in descending priority; ties are
 * broken by ascending rule id, which is stable across runtimes and storage
 * engines.
 */
export function evaluatePolicy(
  policy: CompiledPolicy,
  context: RequestContext,
  options: EvalOptions = {},
): PolicyDecision {
  if (!policy.enabled) return defaultDecision(policy);

  const rules = policy.rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const matchedRules: MatchedRule[] = [];
  const events: SecurityEvent[] = [];
  const rateLimits: RateLimitDirective[] = [];
  const traces: TraceNode[] = [];

  for (const rule of rules) {
    const result = evaluateExpression(rule.expression, context, options);
    if (result.trace) traces.push(result.trace);
    if (result.value !== true) continue;

    matchedRules.push({ id: rule.id, name: rule.name, action: rule.action });

    if (rule.action.type === "log") {
      events.push({ ruleId: rule.id, ruleName: rule.name, action: rule.action, event: rule.action.event });
      continue;
    }

    if (rule.action.type === "rate_limit") {
      rateLimits.push({ key: rateLimitKey(rule.action.config, context), config: rule.action.config });
      events.push({ ruleId: rule.id, ruleName: rule.name, action: rule.action });
      continue;
    }

    if (isTerminal(rule.action)) {
      return {
        effect: rule.action.type,
        action: rule.action,
        enforced: policy.mode === "enforce",
        matchedRules,
        events,
        rateLimits,
        ...(options.trace ? { trace: traces } : {}),
      };
    }
  }

  const decision = defaultDecision(policy);
  return {
    ...decision,
    matchedRules,
    events,
    rateLimits,
    ...(options.trace ? { trace: traces } : {}),
  };
}

export interface SimulationRequest {
  name?: string;
  context: RequestContext;
}

export interface SimulationResult {
  name?: string;
  decision: PolicyDecision;
}

export function simulatePolicy(
  policy: CompiledPolicy,
  requests: SimulationRequest[],
  options: EvalOptions & { datasets?: Record<string, RuntimeDataset> } = {},
): SimulationResult[] {
  return requests.map((request) => ({
    name: request.name,
    decision: evaluatePolicy(policy, request.context, { ...options, trace: true }),
  }));
}
