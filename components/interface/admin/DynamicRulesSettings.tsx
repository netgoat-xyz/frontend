"use client";

import { useMemo, useState } from "react";
import { Code2, Loader2, Plus, Save, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateAgentDynamicRules } from "@/actions/adminValues";
import {
  DYNAMIC_RULE_LIMITS,
  byteLength,
  normalizeDynamicRulesConfig,
  validateDynamicRulesConfig,
  type DynamicRule,
  type DynamicRuleLanguage,
  type DynamicRulesConfig,
} from "@/lib/agent-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type NumericConfigKey =
  | "max_rules"
  | "max_source_bytes"
  | "max_compiled_bytes"
  | "max_input_bytes"
  | "max_result_bytes"
  | "max_execution_milliseconds";

const EXAMPLE_SOURCE = `export function evaluate(request: Request) {
  if (request.path.startsWith("/admin")) {
    return { action: "block", reason: "admin paths are private" };
  }
  return null;
}`;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes % 1024 === 0 ? 0 : 1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function newRule(index: number): DynamicRule {
  return {
    name: `rule-${index + 1}`,
    language: "typescript",
    source: EXAMPLE_SOURCE,
  };
}

export function DynamicRulesSettings({ initialValue }: { initialValue?: unknown }) {
  const [config, setConfig] = useState<DynamicRulesConfig>(() => normalizeDynamicRulesConfig(initialValue));
  const [saving, setSaving] = useState(false);
  const validationErrors = useMemo(() => validateDynamicRulesConfig(config), [config]);
  const totalSourceBytes = useMemo(
    () => config.rules.reduce((total, rule) => total + byteLength(rule.source), 0),
    [config.rules],
  );

  const updateNumber = (key: NumericConfigKey, rawValue: string) => {
    const value = Number(rawValue);
    setConfig((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? Math.trunc(value) : 0,
    }));
  };

  const updateRule = (index: number, patch: Partial<DynamicRule>) => {
    setConfig((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule),
    }));
  };

  const addRule = () => {
    if (config.rules.length >= config.max_rules || config.rules.length >= DYNAMIC_RULE_LIMITS.maxRules.max) return;
    setConfig((current) => ({ ...current, rules: [...current.rules, newRule(current.rules.length)] }));
  };

  const removeRule = (index: number) => {
    setConfig((current) => ({ ...current, rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index) }));
  };

  const saveRules = async () => {
    if (validationErrors.length > 0) {
      toast.error("Resolve the dynamic-rule validation errors before saving.");
      return;
    }

    setSaving(true);
    try {
      const saved = await updateAgentDynamicRules(config);
      setConfig(saved);
      toast.success("Dynamic rules saved. Connected agents will receive the next configuration snapshot.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not save dynamic rules.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" /> Dynamic edge rules
            </CardTitle>
            <CardDescription className="mt-1.5 max-w-3xl">
              Run bounded TypeScript or JavaScript decisions before a request reaches an upstream. Rules may explicitly
              allow, block, or return no decision; an error fails closed at the edge.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-input/30 px-3 py-2">
            <Label htmlFor="dynamic-rules-enabled" className="text-sm">Enable rules</Label>
            <Switch
              id="dynamic-rules-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled: boolean) => setConfig((current) => ({ ...current, enabled }))}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
          <div className="flex gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Rules are stored in the admin settings document and delivered to connected edge agents. Do not put API
              keys, passwords, or other secrets in rule source. This editor requires an administrator session.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h3 className="font-medium">Execution limits</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              These limits are independently enforced by the control plane and the agent runtime.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NumberField
              id="max-rules"
              label="Maximum rules"
              description="1–64 rules in the published snapshot."
              value={config.max_rules}
              min={DYNAMIC_RULE_LIMITS.maxRules.min}
              max={DYNAMIC_RULE_LIMITS.maxRules.max}
              onChange={(value) => updateNumber("max_rules", value)}
            />
            <NumberField
              id="max-source-bytes"
              label="Maximum source bytes per rule"
              description="1 KiB–64 KiB for each rule."
              value={config.max_source_bytes}
              min={DYNAMIC_RULE_LIMITS.maxSourceBytes.min}
              max={DYNAMIC_RULE_LIMITS.maxSourceBytes.max}
              onChange={(value) => updateNumber("max_source_bytes", value)}
            />
            <NumberField
              id="max-compiled-bytes"
              label="Maximum compiled bytes"
              description="1 KiB–256 KiB after TypeScript compilation."
              value={config.max_compiled_bytes}
              min={DYNAMIC_RULE_LIMITS.maxCompiledBytes.min}
              max={DYNAMIC_RULE_LIMITS.maxCompiledBytes.max}
              onChange={(value) => updateNumber("max_compiled_bytes", value)}
            />
            <NumberField
              id="max-input-bytes"
              label="Maximum request bytes"
              description="1 KiB–64 KiB copied into a rule."
              value={config.max_input_bytes}
              min={DYNAMIC_RULE_LIMITS.maxInputBytes.min}
              max={DYNAMIC_RULE_LIMITS.maxInputBytes.max}
              onChange={(value) => updateNumber("max_input_bytes", value)}
            />
            <NumberField
              id="max-result-bytes"
              label="Maximum result bytes"
              description="64 B–4 KiB for a rule decision."
              value={config.max_result_bytes}
              min={DYNAMIC_RULE_LIMITS.maxResultBytes.min}
              max={DYNAMIC_RULE_LIMITS.maxResultBytes.max}
              onChange={(value) => updateNumber("max_result_bytes", value)}
            />
            <NumberField
              id="max-execution-milliseconds"
              label="Maximum execution time"
              description="1–500 ms per evaluation."
              value={config.max_execution_milliseconds}
              min={DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.min}
              max={DYNAMIC_RULE_LIMITS.maxExecutionMilliseconds.max}
              onChange={(value) => updateNumber("max_execution_milliseconds", value)}
            />
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-medium">Rules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {config.rules.length} of {config.max_rules} rules · {formatBytes(totalSourceBytes)} of {formatBytes(DYNAMIC_RULE_LIMITS.maxTotalSourceBytes)} source budget.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addRule}
              disabled={config.rules.length >= config.max_rules || config.rules.length >= DYNAMIC_RULE_LIMITS.maxRules.max}
            >
              <Plus className="mr-2 h-4 w-4" /> Add rule
            </Button>
          </div>

          {config.rules.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              No dynamic rules are configured. Add a rule to start with a safe, inspectable template.
            </div>
          ) : (
            <div className="space-y-4">
              {config.rules.map((rule, index) => {
                const sourceBytes = byteLength(rule.source);
                return (
                  <div key={`dynamic-rule-${index}`} className="space-y-4 rounded-lg border bg-input/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor={`dynamic-rule-name-${index}`}>Rule name</Label>
                        <Input
                          id={`dynamic-rule-name-${index}`}
                          value={rule.name}
                          maxLength={DYNAMIC_RULE_LIMITS.maxRuleNameLength}
                          placeholder="e.g. block-private-admin"
                          autoComplete="off"
                          onChange={(event) => updateRule(index, { name: event.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 sm:w-48">
                        <Label>Language</Label>
                        <Select
                          value={rule.language}
                          onValueChange={(language: string | null) => {
                            if (language === "typescript" || language === "javascript") {
                              updateRule(index, { language: language as DynamicRuleLanguage });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${rule.name || `rule ${index + 1}`}`}
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor={`dynamic-rule-source-${index}`}>Source</Label>
                        <span className={`text-xs ${sourceBytes > config.max_source_bytes ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatBytes(sourceBytes)} / {formatBytes(config.max_source_bytes)}
                        </span>
                      </div>
                      <Textarea
                        id={`dynamic-rule-source-${index}`}
                        value={rule.source}
                        rows={10}
                        spellCheck={false}
                        autoCapitalize="none"
                        autoComplete="off"
                        className="min-h-52 font-mono text-xs leading-5"
                        placeholder="export function evaluate(request) { return null; }"
                        onChange={(event) => updateRule(index, { source: event.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Export <code>evaluate</code> or a default function. Return <code>null</code> to continue, or an action object such as <code>{'{ action: "block", reason: "…" }'}</code>.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4" role="alert">
            <p className="font-medium text-destructive">Resolve these limits before saving</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive/90">
              {validationErrors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Saving changes updates only <code>agentConfig.dynamic_rules</code>; other agent settings stay untouched.
        </p>
        <Button type="button" onClick={saveRules} disabled={saving || validationErrors.length > 0}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save dynamic rules
        </Button>
      </CardFooter>
    </Card>
  );
}

function NumberField({
  id,
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
