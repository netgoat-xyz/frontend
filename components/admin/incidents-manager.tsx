"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Edit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createIncidentAction,
  deleteIncidentAction,
  updateIncidentAction,
} from "@/actions/admin-incidents";
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
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import type { IncidentView } from "@/lib/data/incidents";
import { formatRelativeTime } from "@/lib/format";
import type { IncidentSeverity, IncidentStatus } from "@/models/Incident";

const STATUS_ITEMS: Array<{ label: string; value: IncidentStatus }> = [
  { label: "Investigating", value: "investigating" },
  { label: "Identified", value: "identified" },
  { label: "Monitoring", value: "monitoring" },
  { label: "Resolved", value: "resolved" },
];

const SEVERITY_ITEMS: Array<{ label: string; value: IncidentSeverity }> = [
  { label: "Minor", value: "minor" },
  { label: "Major", value: "major" },
  { label: "Critical", value: "critical" },
];

type IncidentDraft = {
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
};

const EMPTY_DRAFT: IncidentDraft = {
  title: "",
  description: "",
  status: "investigating",
  severity: "minor",
};

function severityBadge(severity: IncidentSeverity) {
  if (severity === "critical") return "error" as const;
  if (severity === "major") return "warning" as const;
  return "outline" as const;
}

/** Incident list with create/edit dialog, inline status change and delete. */
export function IncidentsManager({ incidents }: { incidents: IncidentView[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<{ id?: string } | null>(null);
  const [draft, setDraft] = useState<IncidentDraft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IncidentView | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setEditor({});
  }

  function openEdit(incident: IncidentView) {
    setDraft({
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
    });
    setError(null);
    setEditor({ id: incident.id });
  }

  async function save() {
    if (!editor) return;
    setPending(true);
    setError(null);

    const result = editor.id
      ? await updateIncidentAction({ id: editor.id, incident: draft })
      : await createIncidentAction(draft);

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: editor.id ? "Incident updated" : "Incident opened",
    });
    setEditor(null);
    router.refresh();
  }

  async function changeStatus(incident: IncidentView, status: IncidentStatus) {
    setStatusUpdatingId(incident.id);
    const result = await updateIncidentAction({
      id: incident.id,
      incident: {
        title: incident.title,
        description: incident.description,
        status,
        severity: incident.severity,
      },
    });
    setStatusUpdatingId(null);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Update failed", description: result.error });
      return;
    }

    toastManager.add({
      type: "success",
      title: status === "resolved" ? "Incident resolved" : `Status set to ${status}`,
    });
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteIncidentAction({ id: deleting.id });
    setPending(false);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Delete failed", description: result.error });
      return;
    }

    toastManager.add({ type: "success", title: "Incident deleted" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">
          {incidents.length} incident{incidents.length === 1 ? "" : "s"} ·{" "}
          {incidents.filter((incident) => incident.active).length} open
        </p>
        <Button size="sm" className="ms-auto" onClick={openCreate}>
          <HugeiconsIcon icon={PlusSignIcon} />
          New incident
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {incidents.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
            No incidents recorded. Nice.
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityBadge(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  <span className="truncate text-sm font-medium">
                    {incident.title}
                  </span>
                  {incident.active ? (
                    <Badge variant="warning">Open</Badge>
                  ) : (
                    <Badge variant="success">Resolved</Badge>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {incident.description}
                </p>
                <span className="text-muted-foreground text-xs">
                  Opened {formatRelativeTime(incident.createdAt)}
                  {incident.resolvedAt
                    ? ` · resolved ${formatRelativeTime(incident.resolvedAt)}`
                    : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {statusUpdatingId === incident.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Select
                    items={STATUS_ITEMS}
                    value={incident.status}
                    onValueChange={(next) =>
                      changeStatus(incident, (next as IncidentStatus) ?? "investigating")
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {STATUS_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${incident.title}`}
                  onClick={() => openEdit(incident)}
                >
                  <HugeiconsIcon icon={Edit02Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${incident.title}`}
                  onClick={() => setDeleting(incident)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogPopup className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "Edit incident" : "New incident"}
            </DialogTitle>
            <DialogDescription>
              Open incidents drive the public status page. Resolving one closes
              it automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            <Field>
              <FieldLabel htmlFor="incident-title">Title</FieldLabel>
              <Input
                id="incident-title"
                value={draft.title}
                maxLength={200}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="Elevated error rates on edge nodes"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="incident-description">Description</FieldLabel>
              <Textarea
                id="incident-description"
                value={draft.description}
                rows={4}
                maxLength={5000}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                placeholder="What is happening, what is affected, and what is being done?"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  items={STATUS_ITEMS}
                  value={draft.status}
                  onValueChange={(next) =>
                    setDraft({
                      ...draft,
                      status: (next as IncidentStatus) ?? "investigating",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Severity</FieldLabel>
                <Select
                  items={SEVERITY_ITEMS}
                  value={draft.severity}
                  onValueChange={(next) =>
                    setDraft({
                      ...draft,
                      severity: (next as IncidentSeverity) ?? "minor",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {SEVERITY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>

            <FormError message={error} />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button disabled={pending} onClick={save}>
              {pending ? <Spinner className="size-4" /> : null}
              {editor?.id ? "Save incident" : "Open incident"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this incident?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be removed from the status history. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? <Spinner className="size-4" /> : null}
              Delete incident
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
