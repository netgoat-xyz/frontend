"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Database02Icon,
  Delete02Icon,
  FloppyDiskIcon,
  PauseIcon,
  PlayIcon,
  ScrollIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteDomainAction, setDomainActiveAction } from "@/actions/domains";
import {
  updateDomainRoutePolicyAction,
  updateDomainSettingsAction,
  updateDomainOriginAction,
} from "@/actions/domain-settings";
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
import { toastManager } from "@/components/ui/toast";
import type { RouteKeyMode, RoutePolicy } from "@/lib/control-plane";

/* -------------------------------------------------------------------------- */
/* Origin                                                                     */
/* -------------------------------------------------------------------------- */

/** Primary origin editor (used for domains and subdomains). */
export function OriginForm({
  teamSlug,
  domainId,
  subdomain,
  hostname,
  initialOrigin,
}: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  hostname: string;
  initialOrigin: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dirty = origin.trim() !== initialOrigin;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;

    setPending(true);
    setError(null);

    const result = await updateDomainOriginAction({
      teamSlug,
      domainId,
      subdomain,
      target_url: origin,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "Origin updated",
      description: "Applies on the next edge snapshot.",
    });
    setOrigin(result.data.origin);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={ServerStack01Icon} className="size-4" />
            Origin
          </CardTitle>
          <CardDescription>
            Where {hostname} forwards requests when no upstream pool matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="origin-url">Origin URL</FieldLabel>
            <Input
              id="origin-url"
              spellCheck={false}
              autoComplete="off"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="https://origin.internal:8443"
            />
            <FieldDescription>
              http(s) only, no credentials, query strings or fragments.
            </FieldDescription>
          </Field>
          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} />
            )}
            Save origin
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Route policy (cache + bandwidth)                                           */
/* -------------------------------------------------------------------------- */

const KEY_MODES: RouteKeyMode[] = ["ip", "host", "route", "global"];

const KEY_MODE_ITEMS = KEY_MODES.map((value) => ({ label: value, value }));

const MIB = 1024 * 1024;

/** Cache and bandwidth overrides streamed to agents as `route_policy`. */
export function CachePolicyForm({
  teamSlug,
  domainId,
  policy,
}: {
  teamSlug: string;
  domainId: string;
  policy: RoutePolicy | null;
}) {
  const router = useRouter();

  const [cacheEnabled, setCacheEnabled] = useState(
    policy?.cache?.enabled ?? false,
  );
  const [ttl, setTtl] = useState(String(policy?.cache?.ttl_seconds ?? 300));
  const [maxEntries, setMaxEntries] = useState(
    String(policy?.cache?.max_entries ?? 10000),
  );
  const [maxBody, setMaxBody] = useState(
    String(
      Math.round((policy?.cache?.max_body_bytes ?? 10 * MIB) / MIB) || 10,
    ),
  );
  const [bandwidthEnabled, setBandwidthEnabled] = useState(
    policy?.bandwidth?.enabled ?? false,
  );
  const [rate, setRate] = useState(
    String(Math.round((policy?.bandwidth?.bytes_per_second ?? 5 * MIB) / MIB)),
  );
  const [burst, setBurst] = useState(
    String(Math.round((policy?.bandwidth?.burst_bytes ?? 10 * MIB) / MIB)),
  );
  const [key, setKey] = useState<RouteKeyMode>(policy?.bandwidth?.key ?? "ip");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "reset" | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("save");
    setError(null);

    const nextPolicy: RoutePolicy = {};

    if (cacheEnabled) {
      nextPolicy.cache = {
        enabled: true,
        ttl_seconds: Number(ttl) || 300,
        max_entries: Number(maxEntries) || 10000,
        max_body_bytes: (Number(maxBody) || 10) * MIB,
      };
    }

    if (bandwidthEnabled) {
      nextPolicy.bandwidth = {
        enabled: true,
        bytes_per_second: (Number(rate) || 5) * MIB,
        burst_bytes: (Number(burst) || 10) * MIB,
        key,
      };
    }

    const result = await updateDomainRoutePolicyAction({
      teamSlug,
      domainId,
      route_policy: Object.keys(nextPolicy).length > 0 ? nextPolicy : null,
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: result.data.cleared ? "Policy cleared" : "Policy saved",
      description: "Agents pick it up on the next snapshot.",
    });
    router.refresh();
  }

  async function reset() {
    setPending("reset");
    setError(null);

    const result = await updateDomainRoutePolicyAction({
      teamSlug,
      domainId,
      route_policy: null,
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCacheEnabled(false);
    setBandwidthEnabled(false);
    toastManager.add({ type: "success", title: "Overrides reset" });
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={save}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Database02Icon} className="size-4" />
            Cache &amp; bandwidth
          </CardTitle>
          <CardDescription>
            Route-policy overrides for this host. When both switches are off,
            the policy is removed entirely.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Response cache</span>
                <span className="text-muted-foreground text-xs">
                  Serve cached responses at the edge.
                </span>
              </div>
              <Switch
                checked={cacheEnabled}
                onCheckedChange={setCacheEnabled}
                aria-label="Enable the response cache"
              />
            </div>

            {cacheEnabled ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="cache-ttl">TTL (seconds)</FieldLabel>
                  <Input
                    id="cache-ttl"
                    type="number"
                    min={1}
                    max={86400}
                    value={ttl}
                    onChange={(event) => setTtl(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cache-entries">Max entries</FieldLabel>
                  <Input
                    id="cache-entries"
                    type="number"
                    min={1}
                    max={100000}
                    value={maxEntries}
                    onChange={(event) => setMaxEntries(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cache-body">Max body (MiB)</FieldLabel>
                  <Input
                    id="cache-body"
                    type="number"
                    min={1}
                    max={100}
                    value={maxBody}
                    onChange={(event) => setMaxBody(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Bandwidth limit</span>
                <span className="text-muted-foreground text-xs">
                  Throttle clients at the edge.
                </span>
              </div>
              <Switch
                checked={bandwidthEnabled}
                onCheckedChange={setBandwidthEnabled}
                aria-label="Enable bandwidth limiting"
              />
            </div>

            {bandwidthEnabled ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="rate">Rate (MiB/s)</FieldLabel>
                  <Input
                    id="rate"
                    type="number"
                    min={1}
                    max={10240}
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="burst">Burst (MiB)</FieldLabel>
                  <Input
                    id="burst"
                    type="number"
                    min={1}
                    max={10240}
                    value={burst}
                    onChange={(event) => setBurst(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Bucket key</FieldLabel>
                  <Select
                    items={KEY_MODE_ITEMS}
                    value={key}
                    onValueChange={(next) =>
                      setKey((next as RouteKeyMode) ?? "ip")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {KEY_MODES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
              </div>
            ) : null}
          </div>

          <FormError message={error} />
        </CardContent>

        <CardFooter className="flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={pending !== null}
            onClick={reset}
          >
            {pending === "reset" ? <Spinner className="size-4" /> : null}
            Reset overrides
          </Button>
          <Button type="submit" disabled={pending !== null}>
            {pending === "save" ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} />
            )}
            Save policy
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Log level                                                                  */
/* -------------------------------------------------------------------------- */

const LOG_LEVELS = ["none", "errors", "all"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_LEVEL_ITEMS = LOG_LEVELS.map((value) => ({ label: value, value }));

const LOG_HINTS: Record<LogLevel, string> = {
  none: "No request logging at the edge.",
  errors: "Only failures are recorded.",
  all: "Every request is recorded.",
};

export function LogLevelForm({
  teamSlug,
  domainId,
  initial,
}: {
  teamSlug: string;
  domainId: string;
  initial: LogLevel;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<LogLevel>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await updateDomainSettingsAction({
      teamSlug,
      domainId,
      log_level: level,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({ type: "success", title: "Log level updated" });
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={ScrollIcon} className="size-4" />
            Request logging
          </CardTitle>
          <CardDescription>{LOG_HINTS[level]}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Log level</FieldLabel>
            <Select
              items={LOG_LEVEL_ITEMS}
              value={level}
              onValueChange={(next) => setLevel((next as LogLevel) ?? "errors")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {LOG_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending || level === initial}>
            {pending ? <Spinner className="size-4" /> : null}
            Save log level
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Danger zone                                                                */
/* -------------------------------------------------------------------------- */

export function DangerZone({
  teamSlug,
  domainId,
  domainName,
  active,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"toggle" | "delete" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function toggle() {
    setPending("toggle");
    const result = await setDomainActiveAction({
      teamSlug,
      domainId,
      active: !active,
    });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not update the domain",
        description: result.error,
      });
      return;
    }

    toastManager.add({
      type: "success",
      title: active ? "Domain paused" : "Domain enabled",
    });
    router.refresh();
  }

  async function remove() {
    setPending("delete");
    const result = await deleteDomainAction({ teamSlug, domainId });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not delete the domain",
        description: result.error,
      });
      return;
    }

    toastManager.add({ type: "success", title: "Domain deleted" });
    router.push(`/dashboard/${teamSlug}`);
    router.refresh();
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive-foreground flex items-center gap-2">
          <HugeiconsIcon icon={Alert02Icon} className="size-4" />
          Danger zone
        </CardTitle>
        <CardDescription>
          Pausing stops the edge from routing traffic. Deleting also removes its
          DNS records and upstream pools.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={pending !== null} onClick={toggle}>
          {pending === "toggle" ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={active ? PauseIcon : PlayIcon} />
          )}
          {active ? "Pause domain" : "Enable domain"}
        </Button>

        <Button
          variant="destructive-outline"
          disabled={pending !== null}
          onClick={() => setConfirmOpen(true)}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          Delete domain
        </Button>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {domainName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Traffic stops immediately and {domainName} is removed from the
              workspace together with its DNS records and pools. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={pending === "delete"} onClick={remove}>
              {pending === "delete" ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} />
              )}
              Delete domain
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Card>
  );
}
