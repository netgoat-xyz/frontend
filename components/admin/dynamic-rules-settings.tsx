"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  FloppyDiskIcon,
  PlusSignIcon,
  SourceCodeIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";

import { updateDynamicRulesAction } from "@/actions/admin-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  DYNAMIC_RULE_LIMITS,
  byteLength,
  validateDynamicRulesConfig,
  type DynamicRule,
  type DynamicRuleLanguage,
  type DynamicRulesConfig,
} from "@/lib/agent-config";
import { FormError } from "@/components/auth/auth-card";
import { formatBytes } from "@/lib/format";

const EXAMPLE_SOURCE = `export function evaluate(request: Request) {
  if (request.path.startsWith("/admin")) {
    return { action: "block", reason: "admin paths are private" };
  }
  return null;
}`;

const LANGUAGE_ITEMS = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
];

const NUMBER_FIELDS: Array<{
  key:
    | "max_rules"
    | "max_source_bytes"
    | "max_compiled_bytes"
    | "max_input_bytes"
    | "max_result_bytes"
    | "max_execution_milliseconds";
  label: string;
  description: string;
  unit?: string;
}> = [
  {
    key: "max_rules",
    label: "Maximum rules",
    description: "How many rules agents accept in one snapshot.",
  },
  {
    key: "max_source_bytes",
    label: "Max source bytes",
    description: "Per-rule source ceiling.",
    unit: "bytes",
  },
  {
    key: "max_compiled_bytes",
    label: "Max compiled bytes",
    description: "Compiled artifact ceiling per rule.",
    unit: "bytes",
  },
  {
    key: "max_input_bytes",
    label: "Max input bytes",
    description: "Request context passed to each rule.",
    unit: "bytes",
  },
  {
    key: "max_result_bytes",
    label: "Max result bytes",
    description: "Rule result size agents accept.",
    unit: "bytes",
  },
  {
    key: "max_execution_milliseconds",
    label: "Execution timeout",
    description: "Wall-clock budget for one rule.",
    unit: "ms",
  },
];

/** Edge-agent dynamic rules editor with the same validation the server runs. */
export function DynamicRulesSettings({
  initialConfig,
}: {
  initialConfig: DynamicRulesConfig;
}) {
  const [config, setConfig] = useState<DynamicRulesConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validationErrors = validateDynamicRulesConfig(config);
  const totalSourceBytes = config.rules.reduce(
    (sum, rule) => sum + byteLength(rule.source),
    0,
  );

  function setRule(index: number, next: DynamicRule) {
    setConfig((current) => {
      const rules = [...current.rules];
      rules[index] = next;
      return { ...current, rules };
    });
  }

  async function save() {
    setSaving(true);
    setServerError(null);

    const result = await updateDynamicRulesAction(config);
    setSaving(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    setConfig(result.data);
    toastManager.add({
      type: "success",
      title: "Dynamic rules saved",
      description:
        "Connected agents will receive this configuration on their next snapshot.",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Dynamic rules</CardTitle>
            <CardDescription>
              Request-time logic compiled by edge agents. Return{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                null
              </code>{" "}
              to continue or{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                {`{ action: "block", reason }`}
              </code>{" "}
              to stop a request.
            </CardDescription>
          </div>
          <div className="flex h-9 items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
              aria-label="Enable dynamic rules"
            />
            <span className="text-sm">{config.enabled ? "Enabled" : "Disabled"}</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {config.rules.length} of {config.max_rules} rules
            </Badge>
            <Badge
              variant={
                totalSourceBytes > DYNAMIC_RULE_LIMITS.maxTotalSourceBytes
                  ? "error"
                  : "outline"
              }
            >
              {formatBytes(totalSourceBytes)} of{" "}
              {formatBytes(DYNAMIC_RULE_LIMITS.maxTotalSourceBytes)} source budget
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NUMBER_FIELDS.map((field) => (
              <Field key={field.key}>
                <FieldLabel htmlFor={`rule-${field.key}`}>
                  {field.label}
                  {field.unit ? (
                    <span className="text-muted-foreground"> ({field.unit})</span>
                  ) : null}
                </FieldLabel>
                <Input
                  id={`rule-${field.key}`}
                  type="number"
                  value={config[field.key]}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      [field.key]: Number.parseInt(event.target.value || "0", 10),
                    })
                  }
                />
                <FieldDescription>{field.description}</FieldDescription>
              </Field>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {config.rules.map((rule, index) => {
          const sourceBytes = byteLength(rule.source);
          return (
            <Card key={`${rule.name}-${index}`}>
              <CardHeader className="flex-row items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Rule ${index + 1} name`}
                      value={rule.name}
                      maxLength={DYNAMIC_RULE_LIMITS.maxRuleNameLength}
                      onChange={(event) =>
                        setRule(index, { ...rule, name: event.target.value })
                      }
                      className="max-w-xs"
                    />
                    <Select
                      items={LANGUAGE_ITEMS}
                      value={rule.language}
                      onValueChange={(next) =>
                        setRule(index, {
                          ...rule,
                          language: (next as DynamicRuleLanguage) ?? "typescript",
                        })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectPopup>
                        {LANGUAGE_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                    <Badge
                      variant={sourceBytes > config.max_source_bytes ? "error" : "outline"}
                    >
                      {formatBytes(sourceBytes)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove rule ${rule.name}`}
                  onClick={() =>
                    setConfig({
                      ...config,
                      rules: config.rules.filter((_, i) => i !== index),
                    })
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  aria-label={`Rule ${rule.name} source`}
                  value={rule.source}
                  rows={10}
                  onChange={(event) =>
                    setRule(index, { ...rule, source: event.target.value })
                  }
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          );
        })}

        {config.rules.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-sm">
            <HugeiconsIcon icon={SourceCodeIcon} className="size-6" />
            No rules configured. Agents receive an empty, disabled config.
          </div>
        ) : null}

        <Button
          variant="outline"
          disabled={
            config.rules.length >= config.max_rules ||
            config.rules.length >= DYNAMIC_RULE_LIMITS.maxRules.max
          }
          onClick={() =>
            setConfig({
              ...config,
              rules: [
                ...config.rules,
                {
                  name: `rule-${config.rules.length + 1}`,
                  language: "typescript",
                  source: EXAMPLE_SOURCE,
                },
              ],
            })
          }
        >
          <HugeiconsIcon icon={PlusSignIcon} />
          Add rule
        </Button>
      </div>

      {validationErrors.length > 0 ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-1 rounded-xl border p-4 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <HugeiconsIcon icon={Alert02Icon} className="size-4" />
            Fix these before saving
          </span>
          <ul className="list-inside list-disc">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <FormError message={serverError} />

      <div>
        <Button
          disabled={saving || validationErrors.length > 0}
          onClick={save}
        >
          {saving ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} />
          )}
          Save dynamic rules
        </Button>
      </div>
    </div>
  );
}
