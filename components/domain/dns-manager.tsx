"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  checkDNSPropagationAction,
  createDNSRecordAction,
  deleteDNSRecordAction,
  updateDNSRecordAction,
} from "@/actions/dns";
import { FormError } from "@/components/auth/auth-card";
import { CopyButton } from "@/components/dashboard/copy-button";
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
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import type { ClientDNSRecord } from "@/lib/domain-view";
import { formatRelativeTime } from "@/lib/format";
import { Form } from "../ui/form";

const DNS_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "CAA",
] as const;

const DNS_TYPE_ITEMS = DNS_TYPES.map((value) => ({ label: value, value }));

type DNSRecordType = (typeof DNS_TYPES)[number];

const VALUE_PLACEHOLDERS: Record<DNSRecordType, string> = {
  A: "203.0.113.10",
  AAAA: "2001:db8::1",
  CNAME: "origin.example.com",
  MX: "mail.example.com",
  TXT: "v=spf1 include:_spf.example.com ~all",
  NS: "ns1.example.com",
  SRV: "10 5 443 origin.example.com",
  CAA: '0 issue "letsencrypt.org"',
};

/** DNS record table with inline create, edit and propagation checks. */
export function DNSManager({
  teamSlug,
  domainId,
  domainName,
  records,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  records: ClientDNSRecord[];
}) {
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<ClientDNSRecord | null>(
    null,
  );

  const [type, setType] = useState<DNSRecordType>("A");
  const [name, setName] = useState("@");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("3600");
  const [priority, setPriority] = useState("10");
  const [proxied, setProxied] = useState(true);

  const needsPriority = type === "MX" || type === "SRV";

  function resetForm() {
    setType("A");
    setName("@");
    setValue("");
    setTtl("3600");
    setPriority("10");
    setProxied(true);
    setError(null);
  }

  async function createRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setError(null);

    const result = await createDNSRecordAction({
      teamSlug,
      domainId,
      type,
      name,
      value,
      ttl: Number(ttl) || 3600,
      priority: needsPriority ? Number(priority) || 0 : undefined,
      proxied,
    });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "DNS record created",
      description: "It reaches the edge on the next agent snapshot.",
    });
    setAddOpen(false);
    resetForm();
    router.refresh();
  }

  async function toggleProxied(record: ClientDNSRecord, next: boolean) {
    setPending(`proxied-${record._id}`);
    const result = await updateDNSRecordAction({
      teamSlug,
      recordId: record._id,
      proxied: next,
    });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not update the record",
        description: result.error,
      });
      return;
    }

    router.refresh();
  }

  async function checkPropagation(record: ClientDNSRecord) {
    setPending(`check-${record._id}`);
    const result = await checkDNSPropagationAction({
      teamSlug,
      recordId: record._id,
    });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Propagation check failed",
        description: result.error,
      });
      return;
    }

    if (result.data.propagated) {
      toastManager.add({
        type: "success",
        title: "Record is live",
        description: `${record.name === "@" ? domainName : `${record.name}.${domainName}`} resolves as expected.`,
      });
    } else {
      toastManager.add({
        type: "warning",
        title: "Not visible yet",
        description:
          result.data.observed.length > 0
            ? `Resolvers currently return: ${result.data.observed.slice(0, 3).join(", ")}`
            : "No records were returned for that name yet.",
      });
    }

    router.refresh();
  }

  async function deleteRecord() {
    if (!recordToDelete) return;
    setPending(`delete-${recordToDelete._id}`);

    const result = await deleteDNSRecordAction({
      teamSlug,
      recordId: recordToDelete._id,
    });

    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not delete the record",
        description: result.error,
      });
      return;
    }

    toastManager.add({ type: "success", title: "DNS record deleted" });
    setRecordToDelete(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {records.length} record{records.length === 1 ? "" : "s"} managed on the
          dashboard
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} />
          Add record
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">No DNS records yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create records here and the edge agent publishes them on its next
            snapshot.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="hidden w-[110px] md:table-cell">
                  TTL
                </TableHead>
                <TableHead className="hidden w-[130px] lg:table-cell">
                  Proxied
                </TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[110px] text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const rowPending = pending?.endsWith(record._id) ?? false;
                const lookupName =
                  record.name === "@"
                    ? domainName
                    : `${record.name}.${domainName}`;

                return (
                  <TableRow key={record._id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="block truncate font-mono text-xs">
                        {record.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {lookupName}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <span className="flex items-center gap-1">
                        <span className="truncate font-mono text-xs">
                          {record.value}
                        </span>
                        <CopyButton value={record.value} label="value" />
                      </span>
                      {record.priority !== null ? (
                        <span className="text-muted-foreground text-[11px]">
                          priority {record.priority}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      {record.ttl}s
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Switch
                        checked={record.proxied}
                        disabled={rowPending}
                        aria-label={`Proxy ${lookupName} through NetGoat`}
                        onCheckedChange={(next) => toggleProxied(record, next)}
                      />
                    </TableCell>
                    <TableCell>
                      {record.propagated ? (
                        <Badge variant="success">
                          <HugeiconsIcon icon={Tick02Icon} />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {record.last_checked
                            ? `Checked ${formatRelativeTime(record.last_checked)}`
                            : "Not checked"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Check propagation for ${lookupName}`}
                          disabled={rowPending}
                          onClick={() => checkPropagation(record)}
                        >
                          {pending === `check-${record._id}` ? (
                            <Spinner className="size-4" />
                          ) : (
                            <HugeiconsIcon icon={RefreshIcon} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${lookupName}`}
                          disabled={rowPending}
                          onClick={() => setRecordToDelete(record)}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="text-destructive-foreground"
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add record */}
<Dialog
  open={addOpen}
  onOpenChange={(open) => {
    setAddOpen(open);
    if (!open) resetForm();
  }}
>
  <DialogPopup className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Add DNS record</DialogTitle>
      <DialogDescription>
        Records are published to the edge agent and answer authoritatively for {domainName}.
      </DialogDescription>
    </DialogHeader>

    <Form className="contents" onSubmit={createRecord}>
      <DialogPanel className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              items={DNS_TYPE_ITEMS}
              value={type}
              onValueChange={(next) => setType((next as DNSRecordType) ?? "A")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {DNS_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="dns-name">Name</FieldLabel>
            <Input
              id="dns-name"
              value={name}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
              placeholder="@"
            />
            <FieldDescription>
              Use @ for {domainName} itself.
            </FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="dns-value">Value</FieldLabel>
          <Input
            id="dns-value"
            value={value}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => setValue(event.target.value)}
            placeholder={VALUE_PLACEHOLDERS[type]}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="dns-ttl">TTL (seconds)</FieldLabel>
            <Input
              id="dns-ttl"
              type="number"
              min={60}
              max={86400}
              value={ttl}
              onChange={(event) => setTtl(event.target.value)}
            />
          </Field>

          {needsPriority ? (
            <Field>
              <FieldLabel htmlFor="dns-priority">Priority</FieldLabel>
              <Input
                id="dns-priority"
                type="number"
                min={0}
                max={65535}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel>Proxy through NetGoat</FieldLabel>
              <div className="flex h-9 items-center">
                <Switch
                  checked={proxied}
                  onCheckedChange={setProxied}
                  aria-label="Proxy this record through NetGoat"
                />
              </div>
              <FieldDescription>
                Proxied records hide the origin IP.
              </FieldDescription>
            </Field>
          )}
        </div>

        {needsPriority && (
          <Field>
            <FieldLabel>Proxy through NetGoat</FieldLabel>
            <div className="flex h-9 items-center">
              <Switch
                checked={proxied}
                onCheckedChange={setProxied}
                aria-label="Proxy this record through NetGoat"
              />
            </div>
          </Field>
        )}

        <FormError message={error} />
      </DialogPanel>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" type="button" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending === "create"}>
          {pending === "create" ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} />
          )}
          Create record
        </Button>
      </DialogFooter>
    </Form>
  </DialogPopup>
</Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={recordToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setRecordToDelete(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this DNS record?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordToDelete
                ? `${recordToDelete.type} ${recordToDelete.name} → ${recordToDelete.value} will stop resolving once the agent applies the change.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={
                recordToDelete !== null &&
                pending === `delete-${recordToDelete._id}`
              }
              onClick={deleteRecord}
            >
              {recordToDelete !== null &&
              pending === `delete-${recordToDelete._id}` ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} />
              )}
              Delete record
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
