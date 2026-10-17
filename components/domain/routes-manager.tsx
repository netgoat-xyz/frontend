"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Edit02Icon,
  PlusSignIcon,
  Route01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteProxyConfigAction, upsertProxyConfigAction } from "@/actions/proxies";
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
import type { ClientProxyConfig } from "@/lib/domain-view";

type Scope = { value: string; label: string };

/** Upstream pool editor for the root domain and its subdomains. */
export function RoutesManager({
  teamSlug,
  domainId,
  domainName,
  configs,
  scopes,
  lockedScope,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  configs: ClientProxyConfig[];
  scopes: Scope[];
  lockedScope?: string;
}) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [scope, setScope] = useState(lockedScope ?? "");
  const [name, setName] = useState("");
  const [upstreams, setUpstreams] = useState("");
  const [healthPath, setHealthPath] = useState("/");
  const [preserveHost, setPreserveHost] = useState(true);
  const [websocket, setWebsocket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [configToDelete, setConfigToDelete] = useState<ClientProxyConfig | null>(
    null,
  );

  const scopeLabel = (value: string | null) =>
    value ? `${value}.${domainName}` : domainName;

  function resetForm() {
    setEditingId(null);
    setScope(lockedScope ?? "");
    setName("");
    setUpstreams("");
    setHealthPath("/");
    setPreserveHost(true);
    setWebsocket(false);
    setError(null);
  }

  function startEdit(config: ClientProxyConfig) {
    setEditingId(config._id);
    setScope(config.subdomain ?? "");
    setName(config.name);
    setUpstreams(config.upstream_servers.join("\n"));
    setHealthPath(config.health_check_path);
    setPreserveHost(config.preserve_host);
    setWebsocket(config.websocket_enabled);
    setError(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("save");
    setError(null);

    const upstreamServers = upstreams
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const result = await upsertProxyConfigAction({
      teamSlug,
      domainId,
      configId: editingId ?? undefined,
      subdomain: scope || undefined,
      name: name.trim() || undefined,
      upstream_servers: upstreamServers,
      preserve_host: preserveHost,
      websocket_enabled: websocket,
      health_check_path: healthPath,
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: editingId ? "Route updated" : "Route created",
      description: "The edge switches upstreams on the next snapshot.",
    });
    resetForm();
    router.refresh();
  }

  async function removeConfig() {
    if (!configToDelete) return;
    setPending(`delete-${configToDelete._id}`);

    const result = await deleteProxyConfigAction({
      teamSlug,
      domainId,
      configId: configToDelete._id,
    });

    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not delete the route",
        description: result.error,
      });
      return;
    }

    toastManager.add({ type: "success", title: "Route deleted" });
    setConfigToDelete(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] xl:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Route01Icon} className="size-4" />
            Current routing
            <Badge variant="outline" className="ms-auto">
              {configs.length} pool{configs.length === 1 ? "" : "s"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Traffic is balanced across each pool. Without a pool, requests fall
            back to the single origin.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {configs.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">
              No upstream pools yet — each host uses its origin URL.
            </p>
          ) : (
            configs.map((config) => (
              <div
                key={config._id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{config.name}</span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {scopeLabel(config.subdomain)}
                  </Badge>
                  {config.enabled ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <div className="ms-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${config.name}`}
                      onClick={() => startEdit(config)}
                    >
                      <HugeiconsIcon icon={Edit02Icon} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${config.name}`}
                      disabled={pending !== null}
                      onClick={() => setConfigToDelete(config)}
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="text-destructive-foreground"
                      />
                    </Button>
                  </div>
                </div>

                <ul className="flex flex-col gap-0.5">
                  {config.upstream_servers.map((server) => (
                    <li
                      key={server}
                      className="text-muted-foreground truncate font-mono text-xs"
                    >
                      → {server}
                    </li>
                  ))}
                </ul>

                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded border px-1.5 py-0.5">
                    health {config.health_check_path}
                  </span>
                  {config.preserve_host ? (
                    <span className="rounded border px-1.5 py-0.5">
                      preserve host
                    </span>
                  ) : null}
                  {config.websocket_enabled ? (
                    <span className="rounded border px-1.5 py-0.5">
                      websockets
                    </span>
                  ) : null}
                  {config.total_requests > 0 ? (
                    <span>
                      {config.total_requests.toLocaleString()} requests ·{" "}
                      {config.total_errors.toLocaleString()} errors
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit upstream pool" : "Add upstream pool"}
          </CardTitle>
          <CardDescription>
            Group 1–8 origin servers under one host and let the edge balance
            between them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-5">
            <Field>
              <FieldLabel>Scope</FieldLabel>
              <Select
                items={scopes}
                value={scope}
                onValueChange={(next) => setScope((next as string) ?? "")}
                disabled={Boolean(lockedScope) || Boolean(editingId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a host" />
                </SelectTrigger>
                <SelectPopup>
                  {scopes.map((item) => (
                    <SelectItem key={item.value || "root"} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FieldDescription>
                The pool applies to the selected hostname only.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="pool-name">Pool name</FieldLabel>
              <Input
                id="pool-name"
                maxLength={64}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={scope ? `${scope} pool` : "default pool"}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="pool-upstreams">Upstream servers</FieldLabel>
              <Textarea
                id="pool-upstreams"
                rows={5}
                spellCheck={false}
                className="font-mono text-xs"
                placeholder={"http://10.0.0.4:8080\nhttp://10.0.0.5:8080"}
                value={upstreams}
                onChange={(event) => setUpstreams(event.target.value)}
              />
              <FieldDescription>
                One http(s) URL per line, up to 8. The first becomes the host’s
                primary origin.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="pool-health">Health check path</FieldLabel>
              <Input
                id="pool-health"
                value={healthPath}
                spellCheck={false}
                onChange={(event) => setHealthPath(event.target.value)}
                placeholder="/"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel>Preserve host header</FieldLabel>
                <div className="flex h-9 items-center">
                  <Switch
                    checked={preserveHost}
                    onCheckedChange={setPreserveHost}
                    aria-label="Preserve the host header"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel>WebSocket support</FieldLabel>
                <div className="flex h-9 items-center">
                  <Switch
                    checked={websocket}
                    onCheckedChange={setWebsocket}
                    aria-label="Enable WebSocket proxying"
                  />
                </div>
              </Field>
            </div>

            <FormError message={error} />

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={pending === "save"}>
                {pending === "save" ? (
                  <Spinner className="size-4" />
                ) : (
                  <HugeiconsIcon icon={PlusSignIcon} />
                )}
                {editingId ? "Save route" : "Add route"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={configToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfigToDelete(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{configToDelete?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Traffic for{" "}
              {configToDelete
                ? scopeLabel(configToDelete.subdomain)
                : domainName}{" "}
              falls back to its origin URL once the agent applies the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" onClick={removeConfig}>
              {pending?.startsWith("delete-") ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} />
              )}
              Delete route
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
