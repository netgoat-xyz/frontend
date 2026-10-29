"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Edit02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePostAction } from "@/actions/admin-content";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import { POST_TYPE_LABELS, POST_TYPE_PATHS, POST_TYPES } from "@/lib/content";
import type { AdminPostRow } from "@/lib/data/content";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "all" },
  ...POST_TYPES.map((type) => ({
    label: POST_TYPE_LABELS[type],
    value: type as string,
  })),
];

/** Content table with type filter, pagination and a guarded delete. */
export function ContentManager({
  posts,
  total,
  page,
  pages,
  type,
}: {
  posts: AdminPostRow[];
  total: number;
  page: number;
  pages: number;
  type: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<AdminPostRow | null>(null);
  const [pending, setPending] = useState(false);

  function navigate(nextType: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextType !== "all") params.set("type", nextType);
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    router.replace(suffix ? `/admin/content?${suffix}` : "/admin/content");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);

    const result = await deletePostAction({ id: deleting.id });
    setPending(false);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Delete failed", description: result.error });
      return;
    }

    toastManager.add({
      type: "success",
      title: "Post deleted",
      description: `“${deleting.title}” was removed.`,
    });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={filter.value === type ? "secondary" : "ghost"}
              className={cn("h-7")}
              onClick={() => navigate(filter.value, 1)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} post{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-[130px]">Type</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="hidden w-[160px] lg:table-cell">
                Updated
              </TableHead>
              <TableHead className="w-[130px] text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  No posts yet. Create the first one.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {post.title}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        /{post.slug}
                        {post.author ? ` · ${post.author}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{POST_TYPE_LABELS[post.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {post.published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                      {post.version ? (
                        <span className="text-muted-foreground text-xs">
                          {post.version}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">
                    {formatDateTime(post.updatedAt)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      {post.published ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${post.title}`}
                          render={
                            <a
                              href={`${POST_TYPE_PATHS[post.type]}/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <HugeiconsIcon icon={ViewIcon} />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${post.title}`}
                        render={<Link href={`/admin/content/${post.id}`} />}
                      >
                        <HugeiconsIcon icon={Edit02Icon} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${post.title}`}
                        onClick={() => setDeleting(post)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {page} of {pages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate(type, page - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => navigate(type, page + 1)}
          >
            Next
            <HugeiconsIcon icon={ArrowRight01Icon} />
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
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be permanently removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
              {pending ? <Spinner className="size-4" /> : null}
              Delete post
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
