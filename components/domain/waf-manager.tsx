"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addWafRuleAction, removeWafRuleAction } from "@/actions/domain-settings";
import { FormError } from "@/components/auth/auth-card";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import type { ClientWafRule } from "@/lib/domain-view";

const WAF_ACTIONS = ["BLOCK", "ALLOW", "LOG"] as const;
type WafAction = (typeof WAF_ACTIONS)[number];

const WAF_ACTION_ITEMS = WAF_ACTIONS.map((value) => ({ label: value, value }));

const ACTION_HINTS: Record<WafAction, string> = {
  BLOCK: "Reject the request with 403.",
  ALLOW: "Skip the rest of the rules for matching requests.",
  LOG: "Let it through but record the match.",
};

/** WAF rule list with an inline create form, scoped to a domain or subdomain. */
export function WafManager({
  teamSlug,
  domainId,
  subdomain,
  rules,
  hostname,
}: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  rules: ClientWafRule[];
  hostname: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [action, setAction] = useState<WafAction>("BLOCK");
  const [priority, setPriority] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [ruleToRemove, setRuleToRemove] = useState<ClientWafRule | null>(null);

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("add");
    setError(null);

    const result = await addWafRuleAction({
      teamSlug,
      domainId,
      subdomain,
      rule: {
        name,
        expression,
        language: "wafl",
        action,
        priority: Number(priority) || 0,
      },
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "WAF rule added",
      description: "It applies on the next edge snapshot.",
    });
    setName("");
    setExpression("");
    setAction("BLOCK");
    setPriority("0");
    router.refresh();
  }

  async function removeRule() {
    if (!ruleToRemove) return;
    setPending(`remove-${ruleToRemove.name}`);

    const result = await removeWafRuleAction({
      teamSlug,
      domainId,
      subdomain,
      ruleName: ruleToRemove.name,
    });

    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not remove the rule",
        description: result.error,
      });
      return;
    }

    toastManager.add({ type: "success", title: "WAF rule removed" });
    setRuleToRemove(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Shield02Icon} className="size-4" />
            Rules
            <Badge variant="outline" className="ms-auto">
              {rules.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Rules stream to the edge agent for {hostname} on the next snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {rules.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">
              No rules yet. Requests pass through unfiltered.
            </p>
          ) : (
            [...rules]
              .sort((a, b) => b.priority - a.priority)
              .map((rule) => (
                <div
                  key={rule.name}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {rule.name}
                      <Badge
                        variant={
                          rule.action === "BLOCK"
                            ? "error"
                            : rule.action === "ALLOW"
                              ? "success"
                              : "info"
                        }
                      >
                        {rule.action}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        priority {rule.priority}
                      </span>
                    </span>
                    <span className="text-muted-foreground truncate font-mono text-xs">
                      {rule.expression}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove rule ${rule.name}`}
                    disabled={pending !== null}
                    onClick={() => setRuleToRemove(rule)}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      className="text-destructive-foreground"
                    />
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a rule</CardTitle>
          <CardDescription>
            WAFL conditions are checked before saving and compiled for the edge agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addRule} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="waf-name">Name</FieldLabel>
              <Input
                id="waf-name"
                required
                maxLength={64}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Block admin posts"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="waf-expression">Expression</FieldLabel>
              <Textarea
                id="waf-expression"
                required
                maxLength={512}
                spellCheck={false}
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                placeholder='request.path starts_with "/admin"'
                rows={3}
              />
              <FieldDescription>
                Example: request.method == &quot;POST&quot; and request.path starts_with &quot;/api&quot;
              </FieldDescription>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel>Action</FieldLabel>
                <Select
                  items={WAF_ACTION_ITEMS}
                  value={action}
                  onValueChange={(next) => setAction((next as WafAction) ?? "BLOCK")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {WAF_ACTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <FieldDescription>{ACTION_HINTS[action]}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="waf-priority">Priority</FieldLabel>
                <Input
                  id="waf-priority"
                  type="number"
                  min={0}
                  max={100000}
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                />
                <FieldDescription>Higher runs first.</FieldDescription>
              </Field>
            </div>

            <FormError message={error} />

            <Button type="submit" disabled={pending === "add"}>
              {pending === "add" ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Add01Icon} />
              )}
              Add rule
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={ruleToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setRuleToRemove(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove “{ruleToRemove?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Matching traffic stops being {ruleToRemove?.action.toLowerCase()}
              ed once the agent applies the next snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" onClick={removeRule}>
              {pending?.startsWith("remove-") ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} />
              )}
              Remove rule
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
