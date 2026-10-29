"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addSubdomainAction, removeSubdomainAction } from "@/actions/subdomains";
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
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import type { ClientSubdomain } from "@/lib/domain-view";

/** Subdomain list with inline create and remove. */
export function SubdomainsManager({
  teamSlug,
  domainId,
  domainName,
  subdomains,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  subdomains: ClientSubdomain[];
}) {
  const router = useRouter();

  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [subdomainToRemove, setSubdomainToRemove] =
    useState<ClientSubdomain | null>(null);

  async function addSubdomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("add");
    setError(null);

    const result = await addSubdomainAction({
      teamSlug,
      domainId,
      subdomain: label,
      target_url: origin,
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: `${result.data.fullDomain} added`,
      description: "Point the hostname at the edge and it starts routing.",
    });
    setLabel("");
    setOrigin("");
    router.refresh();
  }

  async function removeSubdomain() {
    if (!subdomainToRemove) return;
    setPending(`remove-${subdomainToRemove.subdomain}`);

    const result = await removeSubdomainAction({
      teamSlug,
      domainId,
      subdomain: subdomainToRemove.subdomain,
    });

    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not remove the subdomain",
        description: result.error,
      });
      return;
    }

    toastManager.add({ type: "success", title: "Subdomain removed" });
    setSubdomainToRemove(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] xl:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} className="size-4" />
            Subdomains
            <Badge variant="outline" className="ms-auto">
              {subdomains.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Each subdomain gets its own routing, WAF rules, certificate and
            access policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {subdomains.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">
              No subdomains yet — add one to route a hostname like api.
              {domainName}.
            </p>
          ) : (
            subdomains.map((entry) => (
              <div
                key={entry.subdomain}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/${teamSlug}/${encodeURIComponent(domainName)}/subdomains/${entry.subdomain}`}
                      className="hover:underline underline-offset-4"
                    >
                      <span className="truncate text-sm font-medium">
                        {entry.full_domain}
                      </span>
                    </Link>
                    {entry.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    → {entry.target_url || "no origin"}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {entry.wafRules.length} WAF rule
                    {entry.wafRules.length === 1 ? "" : "s"} ·{" "}
                    {entry.request_count.toLocaleString()} requests ·{" "}
                    {entry.blocked_count.toLocaleString()} blocked
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link
                        href={`/dashboard/${teamSlug}/${encodeURIComponent(domainName)}/subdomains/${entry.subdomain}`}
                      />
                    }
                  >
                    Open
                    <HugeiconsIcon icon={ArrowRight01Icon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${entry.full_domain}`}
                    disabled={pending !== null}
                    onClick={() => setSubdomainToRemove(entry)}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      className="text-destructive-foreground"
                    />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a subdomain</CardTitle>
          <CardDescription>
            The label is prefixed to {domainName}; the origin is where traffic
            is forwarded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addSubdomain} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="subdomain-label">Label</FieldLabel>
              <Input
                id="subdomain-label"
                required
                maxLength={63}
                spellCheck={false}
                autoComplete="off"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="api"
              />
              <FieldDescription>
                {label ? `${label}.${domainName}` : `label.${domainName}`}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="subdomain-origin">Origin URL</FieldLabel>
              <Input
                id="subdomain-origin"
                required
                spellCheck={false}
                autoComplete="off"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="http://10.0.0.4:8080"
              />
            </Field>

            <FormError message={error} />

            <Button type="submit" disabled={pending === "add"}>
              {pending === "add" ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Add01Icon} />
              )}
              Add subdomain
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={subdomainToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setSubdomainToRemove(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {subdomainToRemove?.full_domain}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Its routing configuration, DNS records and WAF rules are deleted.
              The edge stops serving the hostname on the next snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" onClick={removeSubdomain}>
              {pending?.startsWith("remove-") ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} />
              )}
              Remove subdomain
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
