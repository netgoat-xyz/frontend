"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Mail01Icon, Message02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteFeedbackAction, setFeedbackStatusAction } from "@/actions/feedback";
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
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import type { FeedbackPage, FeedbackView } from "@/lib/data/feedback";
import { formatRelativeTime } from "@/lib/format";
import type { FeedbackStatus } from "@/models/Feedback";
import { cn } from "@/lib/utils";

const STATUS_ITEMS: Array<{ label: string; value: FeedbackStatus }> = [
  { label: "New", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Archived", value: "archived" },
];

const CATEGORY_BADGES: Record<
  FeedbackView["category"],
  { label: string; variant: "info" | "warning" | "success" | "outline" }
> = {
  bug: { label: "Bug", variant: "warning" },
  idea: { label: "Idea", variant: "info" },
  praise: { label: "Praise", variant: "success" },
  other: { label: "Other", variant: "outline" },
};

/** Feedback triage list: status tabs, inline status change and delete. */
export function FeedbackManager({
  page,
  status,
}: {
  page: FeedbackPage;
  status: FeedbackStatus | "all";
}) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FeedbackView | null>(null);
  const [pending, setPending] = useState(false);

  const tabs: Array<{ label: string; value: FeedbackStatus | "all"; count: number }> = [
    {
      label: "All",
      value: "all",
      count: page.counts.new + page.counts.reviewed + page.counts.archived,
    },
    { label: "New", value: "new", count: page.counts.new },
    { label: "Reviewed", value: "reviewed", count: page.counts.reviewed },
    { label: "Archived", value: "archived", count: page.counts.archived },
  ];

  function navigate(nextStatus: FeedbackStatus | "all", nextPage: number) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    router.replace(suffix ? `/admin/feedback?${suffix}` : "/admin/feedback");
  }

  async function changeStatus(entry: FeedbackView, next: FeedbackStatus) {
    setUpdatingId(entry.id);
    const result = await setFeedbackStatusAction({ id: entry.id, status: next });
    setUpdatingId(null);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Update failed", description: result.error });
      return;
    }

    toastManager.add({ type: "success", title: `Marked as ${next}` });
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteFeedbackAction({ id: deleting.id });
    setPending(false);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Delete failed", description: result.error });
      return;
    }

    toastManager.add({ type: "success", title: "Entry deleted" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg border p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={tab.value === status ? "secondary" : "ghost"}
            className={cn("h-7 gap-1.5")}
            onClick={() => navigate(tab.value, 1)}
          >
            {tab.label}
            <Badge variant="outline" className="text-[10px]">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {page.entries.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm">
            <HugeiconsIcon icon={Message02Icon} className="size-6" />
            {status === "all" ? "No feedback yet." : `No ${status} entries.`}
          </div>
        ) : (
          page.entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={CATEGORY_BADGES[entry.category].variant}>
                    {CATEGORY_BADGES[entry.category].label}
                  </Badge>
                  {entry.userName ? (
                    <span className="text-sm font-medium">{entry.userName}</span>
                  ) : null}
                  {entry.email ? (
                    <a
                      href={`mailto:${entry.email}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                    >
                      <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
                      {entry.email}
                    </a>
                  ) : null}
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(entry.createdAt)}
                    {entry.path ? ` · ${entry.path}` : ""}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{entry.message}</p>
              </div>

              <div className="flex items-start gap-2">
                {updatingId === entry.id ? (
                  <Spinner className="mt-2 size-4" />
                ) : (
                  <Select
                    items={STATUS_ITEMS}
                    value={entry.status}
                    onValueChange={(next) =>
                      changeStatus(entry, (next as FeedbackStatus) ?? "new")
                    }
                  >
                    <SelectTrigger className="w-36">
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
                  aria-label="Delete entry"
                  onClick={() => setDeleting(entry)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {page.page} of {page.pages} · {page.total.toLocaleString()} entr
          {page.total === 1 ? "y" : "ies"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page.page <= 1}
            onClick={() => navigate(status, page.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page.page >= page.pages}
            onClick={() => navigate(status, page.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              The feedback will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? <Spinner className="size-4" /> : null}
              Delete entry
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
