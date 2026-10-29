"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Key01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { updateAccessControlAction } from "@/actions/domain-settings";
import { FormError } from "@/components/auth/auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  MAX_ACCESS_CIDRS,
  parseAccessCidrList,
  type AccessControl,
  type AccessMode,
} from "@/lib/control-plane";

const BASE_MODES = ["off", "allowlist", "blocklist"] as const;

const MODE_LABELS: Record<AccessMode, string> = {
  off: "Off — everyone",
  allowlist: "Allowlist only",
  blocklist: "Blocklist",
  inherit: "Inherit domain access",
};

/** Allowlist/blocklist editor for a domain or subdomain. */
export function AccessForm({
  teamSlug,
  domainId,
  subdomain,
  hostname,
  initial,
  allowInherit = false,
}: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  hostname: string;
  initial: AccessControl;
  allowInherit?: boolean;
}) {
  const router = useRouter();

  const modes = useMemo(
    () => (allowInherit ? ["inherit", ...BASE_MODES] : [...BASE_MODES]),
    [allowInherit],
  );

  const modeItems = useMemo(
    () =>
      modes.map((value) => ({
        label: MODE_LABELS[value as AccessMode] ?? value,
        value,
      })),
    [modes],
  );

  const [mode, setMode] = useState<AccessMode>(initial.mode);
  const [cidrText, setCidrText] = useState(initial.cidrs.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const parsed = useMemo(() => parseAccessCidrList(cidrText), [cidrText]);
  const needsCidrs = mode === "allowlist" || mode === "blocklist";

  const dirty =
    mode !== initial.mode ||
    parsed.cidrs.join(",") !== [...initial.cidrs].join(",");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (needsCidrs && parsed.cidrs.length === 0) {
      setError("Add at least one address or CIDR range.");
      return;
    }

    if (parsed.cidrs.length > MAX_ACCESS_CIDRS) {
      setError(`Keep the list to ${MAX_ACCESS_CIDRS} entries or fewer.`);
      return;
    }

    if (parsed.invalid.length > 0) {
      setError(`Not valid: ${parsed.invalid.slice(0, 5).join(", ")}`);
      return;
    }

    setPending(true);
    setError(null);

    const result = await updateAccessControlAction({
      teamSlug,
      domainId,
      subdomain,
      mode,
      cidrs: parsed.cidrs,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "Access rules saved",
      description: "The edge applies them on the next snapshot.",
    });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Key01Icon} className="size-4" />
            Access control
            <Badge variant="outline" className="ms-auto font-mono">
              {hostname}
            </Badge>
          </CardTitle>
          <CardDescription>
            Restrict who can reach this host before requests hit the origin.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel>Mode</FieldLabel>
            <Select
              items={modeItems}
              value={mode}
              onValueChange={(next) => setMode((next as AccessMode) ?? "off")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {modes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {MODE_LABELS[item as AccessMode] ?? item}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldDescription>
              {mode === "off"
                ? "No IP filtering is applied."
                : mode === "allowlist"
                  ? "Only the listed ranges can connect."
                  : mode === "blocklist"
                    ? "Listed ranges are rejected with 403."
                    : "Uses the domain-level policy for this subdomain."}
            </FieldDescription>
          </Field>

          {needsCidrs ? (
            <Field>
              <FieldLabel htmlFor="access-cidrs">
                Addresses and CIDR ranges
              </FieldLabel>
              <Textarea
                id="access-cidrs"
                rows={7}
                spellCheck={false}
                className="font-mono text-xs"
                placeholder={"203.0.113.0/24\n2001:db8::/32\n198.51.100.7"}
                value={cidrText}
                onChange={(event) => setCidrText(event.target.value)}
              />
              <FieldDescription>
                One per line or comma separated. Single addresses become /32
                (or /128). Up to {MAX_ACCESS_CIDRS} entries;{" "}
                {parsed.cidrs.length} parsed.
                {parsed.invalid.length > 0 ? (
                  <span className="text-destructive-foreground">
                    {" "}
                    {parsed.invalid.length} entries are not valid IPs or CIDRs.
                  </span>
                ) : null}
              </FieldDescription>
            </Field>
          ) : null}

          <FormError message={error} />
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={Tick02Icon} />
            )}
            Save access rules
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
