"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createDomainAction,
  verifyDomainAction,
  type DomainVerification,
} from "@/actions/domains";
import { FormError } from "@/components/auth/auth-card";
import { CopyButton } from "@/components/dashboard/copy-button";
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

type VerificationState = {
  domainId: string;
  domain: string;
  verification: DomainVerification;
};

/**
 * Two-step add-domain flow: submit the domain + origin, then (when required)
 * show the ownership TXT record with a live "check again" action.
 */
export function NewDomainForm({ teamSlug }: { teamSlug: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(
    null,
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createDomainAction({
      teamSlug,
      domain,
      target_url: origin,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.data.verification) {
      setVerification({
        domainId: result.data.domainId,
        domain: result.data.domain,
        verification: result.data.verification,
      });
      router.refresh();
      return;
    }

    toastManager.add({ type: "success", title: "Domain added" });
    router.push(`/dashboard/${teamSlug}/${result.data.domain}`);
    router.refresh();
  }

  async function checkVerification() {
    if (!verification) return;
    setChecking(true);

    const result = await verifyDomainAction({
      teamSlug,
      domainId: verification.domainId,
    });

    setChecking(false);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Verification check failed",
        description: result.error,
      });
      return;
    }

    if (!result.data.verified) {
      toastManager.add({
        type: "warning",
        title: "Record not found yet",
        description:
          "DNS changes can take a few minutes to propagate. We'll keep checking automatically too.",
      });
      return;
    }

    toastManager.add({ type: "success", title: "Domain verified" });
    router.push(`/dashboard/${teamSlug}/${verification.domain}`);
    router.refresh();
  }

  if (verification) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Verify ownership of {verification.domain}
          </CardTitle>
          <CardDescription>
            Add this TXT record at your DNS provider. Verification runs
            automatically in the background once the record is live.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="divide-border divide-y rounded-lg border">
            <div className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-muted-foreground text-xs">Type</span>
                <span className="font-mono text-sm">
                  {verification.verification.recordType}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-muted-foreground text-xs">Name</span>
                <span className="truncate font-mono text-sm">
                  {verification.verification.recordName}
                </span>
              </div>
              <CopyButton
                value={verification.verification.recordName}
                label="record name"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-muted-foreground text-xs">Value</span>
                <span className="truncate font-mono text-sm">
                  {verification.verification.recordValue}
                </span>
              </div>
              <CopyButton
                value={verification.verification.recordValue}
                label="record value"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={checkVerification}
              disabled={checking}
            >
              {checking ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={RefreshIcon} />
              )}
              Check verification
            </Button>
            <Button
              variant="ghost"
              render={<Link href={`/dashboard/${teamSlug}`} />}
            >
              Do this later
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
          </div>

          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="text-success size-3.5"
            />
            Local development domains (like *.localhost) are verified
            automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-5">
        <Field>
          <FieldLabel htmlFor="domain-name">Domain</FieldLabel>
          <Input
            id="domain-name"
            name="domain"
            placeholder="example.com"
            autoComplete="off"
            spellCheck={false}
            required
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <FieldDescription>
            The public hostname visitors will hit. Enter the apex domain —
            subdomains are added afterwards.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="domain-origin">Origin</FieldLabel>
          <Input
            id="domain-origin"
            name="origin"
            placeholder="https://origin.internal:8443"
            autoComplete="off"
            spellCheck={false}
            required
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
          />
          <FieldDescription>
            Where NetGoat forwards traffic: any http(s) URL without credentials
            or query strings.
          </FieldDescription>
        </Field>
      </div>

      <FormError message={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} />
          )}
          Add domain
        </Button>
        <Button
          type="button"
          variant="ghost"
          render={<Link href={`/dashboard/${teamSlug}`} />}
        >
          Cancel
        </Button>
        <Badge variant="outline" className="ms-auto hidden sm:inline-flex">
          Quota checked automatically
        </Badge>
      </div>
    </form>
  );
}
