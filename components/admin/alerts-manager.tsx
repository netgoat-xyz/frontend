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
  createAlertAction,
  deleteAlertAction,
  toggleAlertAction,
  updateAlertAction,
} from "@/actions/admin-alerts";
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
import type { AlertView } from "@/lib/data/alerts";
import { formatRelativeTime } from "@/lib/format";

const VARIANT_ITEMS = [
  { label: "Blue — informational", value: "blue" },
  { label: "Yellow — warning", value: "yellow" },
  { label: "Red — critical", value: "red" },
];

type AlertDraft = {
  title: string;
  body: string;
  variant: "red" | "yellow" | "blue";
  actionText: string;
};

const EMPTY_DRAFT: AlertDraft = {
  title: "",
  body: "",
  variant: "blue",
  actionText: "",
};

type EditorState = { mode: "create" } | { mode: "edit"; id: string };

/** Alert list with create/edit dialog, quick toggle and delete. */
export function AlertsManager({ alerts }: { alerts: AlertView[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draft, setDraft] = useState<AlertDraft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AlertView | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setEditor({ mode: "create" });
  }

  function openEdit(alert: AlertView) {
    setDraft({
      title: alert.title,
      body: alert.body,
      variant: alert.variant,
      actionText: alert.actionText,
    });
    setError(null);
    setEditor({ mode: "edit", id: alert.id });
  }

  async function save() {
    if (!editor) return;
    setPending(true);
    setError(null);

    const result =
      editor.mode === "create"
        ? await createAlertAction(draft)
        : await updateAlertAction({ id: editor.id, alert: draft });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: editor.mode === "create" ? "Alert published" : "Alert updated",
    });
    setEditor(null);
    router.refresh();
  }

  async function toggle(alert: AlertView, active: boolean) {
    setTogglingId(alert.id);
    const result = await toggleAlertAction({ id: alert.id, active });
    setTogglingId(null);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Update failed", description: result.error });
      return;
    }

    toastManager.add({
      type: "success",
      title: active ? "Alert shown" : "Alert hidden",
    });
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteAlertAction({ id: deleting.id });
    setPending(false);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Delete failed", description: result.error });
      return;
    }

    toastManager.add({ type: "success", title: "Alert deleted" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">
          {alerts.length} alert{alerts.length === 1 ? "" : "s"} ·{" "}
          {alerts.filter((alert) => alert.active).length} active
        </p>
        <Button size="sm" className="ms-auto" onClick={openCreate}>
          <HugeiconsIcon icon={PlusSignIcon} />
          New alert
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
            No alerts yet. Publish one to announce something to every dashboard.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      alert.variant === "red"
                        ? "error"
                        : alert.variant === "yellow"
                          ? "warning"
                          : "info"
                    }
                  >
                    {alert.variant}
                  </Badge>
                  <span className="truncate text-sm font-medium">{alert.title}</span>
                  {!alert.active ? (
                    <Badge variant="outline">Hidden</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {alert.body}
                </p>
                <span className="text-muted-foreground text-xs">
                  Created {formatRelativeTime(alert.createdAt)}
                  {alert.actionText && alert.actionText !== "Dismiss"
                    ? ` · action “${alert.actionText}”`
                    : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center">
                  {togglingId === alert.id ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Switch
                      checked={alert.active}
                      onCheckedChange={(checked) => toggle(alert, checked)}
                      aria-label={`${alert.active ? "Hide" : "Show"} ${alert.title}`}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${alert.title}`}
                  onClick={() => openEdit(alert)}
                >
                  <HugeiconsIcon icon={Edit02Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${alert.title}`}
                  onClick={() => setDeleting(alert)}
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
              {editor?.mode === "edit" ? "Edit alert" : "New alert"}
            </DialogTitle>
            <DialogDescription>
              Active alerts appear on every team dashboard until hidden.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            <Field>
              <FieldLabel htmlFor="alert-title">Title</FieldLabel>
              <Input
                id="alert-title"
                value={draft.title}
                maxLength={200}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Scheduled maintenance"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="alert-body">Message</FieldLabel>
              <Textarea
                id="alert-body"
                value={draft.body}
                rows={3}
                maxLength={2000}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder="What should people know?"
              />
            </Field>

            <Field>
              <FieldLabel>Variant</FieldLabel>
              <Select
                items={VARIANT_ITEMS}
                value={draft.variant}
                onValueChange={(next) =>
                  setDraft({
                    ...draft,
                    variant: (next as AlertDraft["variant"]) ?? "blue",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {VARIANT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="alert-action">Action label</FieldLabel>
              <Input
                id="alert-action"
                value={draft.actionText}
                maxLength={80}
                onChange={(event) =>
                  setDraft({ ...draft, actionText: event.target.value })
                }
                placeholder="Dismiss"
              />
              <FieldDescription>
                Shown on the alert&rsquo;s button. Defaults to &ldquo;Dismiss&rdquo;.
              </FieldDescription>
            </Field>

            <FormError message={error} />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button disabled={pending} onClick={save}>
              {pending ? <Spinner className="size-4" /> : null}
              {editor?.mode === "edit" ? "Save alert" : "Publish alert"}
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
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be removed from every dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? <Spinner className="size-4" /> : null}
              Delete alert
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
