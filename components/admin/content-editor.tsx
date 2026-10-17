"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  ImageAdd02Icon,
  Upload01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createPostAction, deletePostAction, updatePostAction } from "@/actions/admin-content";
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
import {
  POST_TYPE_LABELS,
  POST_TYPE_PATHS,
  POST_TYPES,
  type PostType,
} from "@/lib/content";
import type { AdminPostDetail } from "@/lib/data/content";

const TYPE_ITEMS = POST_TYPES.map((type) => ({
  label: POST_TYPE_LABELS[type],
  value: type as string,
}));

type Draft = {
  title: string;
  slug: string;
  type: PostType;
  version: string;
  author: string;
  excerpt: string;
  coverImage: string;
  content: string;
  published: boolean;
};

function initialDraft(post?: AdminPostDetail): Draft {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    type: post?.type ?? "blog",
    version: post?.version ?? "",
    author: post?.author ?? "",
    excerpt: post?.excerpt ?? "",
    coverImage: post?.coverImage ?? "",
    content: post?.content ?? "",
    published: post?.published ?? false,
  };
}

/** Uploads one file through the guarded upload route and returns its URL. */
async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload: unknown = await response.json();

    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      typeof (payload as { url?: unknown }).url !== "string"
    ) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : "Upload failed.";
      toastManager.add({ type: "error", title: "Upload failed", description: message });
      return null;
    }

    return (payload as { url: string }).url;
  } catch {
    toastManager.add({
      type: "error",
      title: "Upload failed",
      description: "The file could not be uploaded. Check your connection.",
    });
    return null;
  }
}

/** Post editor with cover upload and paste-to-insert images. */
export function ContentEditor({ post }: { post?: AdminPostDetail }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(post));
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onCoverSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);

    if (url) {
      update("coverImage", url);
      toastManager.add({ type: "success", title: "Cover image uploaded" });
    }
  }

  async function onContentPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (!url) return;

    const insertion = `![Image](${url})`;
    setDraft((current) => ({
      ...current,
      content:
        current.content.slice(0, start) + insertion + current.content.slice(end),
    }));
    toastManager.add({ type: "success", title: "Image inserted at cursor" });
  }

  async function save() {
    setPending(true);
    setError(null);

    const payload = {
      title: draft.title,
      slug: draft.slug || undefined,
      type: draft.type,
      version: draft.version || undefined,
      author: draft.author || undefined,
      excerpt: draft.excerpt || undefined,
      coverImage: draft.coverImage || undefined,
      content: draft.content,
      published: draft.published,
    };

    const result = post
      ? await updatePostAction({ id: post.id, post: payload })
      : await createPostAction(payload);

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (post) {
      toastManager.add({
        type: "success",
        title: "Post saved",
        description: result.data.slug === post.slug
          ? "Your changes are live."
          : `Slug is now /${result.data.slug}.`,
      });
      update("slug", result.data.slug);
      router.refresh();
    } else {
      toastManager.add({ type: "success", title: "Post created" });
      router.push("/admin/content");
    }
  }

  async function remove() {
    if (!post) return;
    setDeleting(true);
    const result = await deletePostAction({ id: post.id });
    setDeleting(false);

    if (!result.ok) {
      toastManager.add({ type: "error", title: "Delete failed", description: result.error });
      return;
    }

    toastManager.add({ type: "success", title: "Post deleted" });
    router.push("/admin/content");
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to content"
          render={<Link href="/admin/content" />}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
            {post ? "Edit post" : "New post"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {post
              ? `Last saved ${new Date(post.updatedAt).toLocaleString()}`
              : "Draft a new piece of content."}
          </p>
        </div>

        <div className="ms-auto flex items-center gap-2">
          {post?.published ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <a
                  href={`${POST_TYPE_PATHS[post.type]}/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <HugeiconsIcon icon={ViewIcon} />
              View
            </Button>
          ) : null}
          {post ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} />
              Delete
            </Button>
          ) : null}
          <Button size="sm" disabled={pending || uploading} onClick={save}>
            {pending ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} />
            )}
            {post ? "Save post" : "Create post"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Body</CardTitle>
              <CardDescription>
                Markdown is supported. Paste an image to upload and insert it at
                the cursor.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="post-title">Title</FieldLabel>
                <Input
                  id="post-title"
                  value={draft.title}
                  maxLength={200}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="A clear, specific headline"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="post-content">Content</FieldLabel>
                <Textarea
                  id="post-content"
                  ref={contentRef}
                  value={draft.content}
                  rows={20}
                  onPaste={onContentPaste}
                  onChange={(event) => update("content", event.target.value)}
                  placeholder={"## Heading\n\nWrite the post in Markdown…"}
                  className="font-mono text-sm"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="post-excerpt">Excerpt</FieldLabel>
                <Textarea
                  id="post-excerpt"
                  value={draft.excerpt}
                  rows={3}
                  maxLength={500}
                  onChange={(event) => update("excerpt", event.target.value)}
                  placeholder="One or two sentences for listings and previews."
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover image</CardTitle>
              <CardDescription>
                Used on listing cards and social previews.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Cover image URL"
                  value={draft.coverImage}
                  maxLength={2048}
                  onChange={(event) => update("coverImage", event.target.value)}
                  placeholder="/uploads/image.png or https://…"
                  className="min-w-[220px] flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
                    onChange={onCoverSelected}
                    disabled={uploading}
                    aria-label="Upload cover image"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <Button type="button" variant="outline" disabled={uploading}>
                    {uploading ? (
                      <Spinner className="size-4" />
                    ) : (
                      <HugeiconsIcon icon={Upload01Icon} />
                    )}
                    Upload
                  </Button>
                </div>
              </div>

              {draft.coverImage ? (
                // Arbitrary admin-provided URLs cannot be constrained, so a
                // plain img element is intentional here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.coverImage}
                  alt="Cover preview"
                  className="max-h-56 w-full rounded-lg border object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm">
                  <HugeiconsIcon icon={ImageAdd02Icon} />
                  No cover image yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Where and how this post appears.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                items={TYPE_ITEMS}
                value={draft.type}
                onValueChange={(next) => {
                  const nextType = (next as PostType) ?? "blog";
                  setDraft((current) => ({ ...current, type: nextType }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FieldDescription>
                Blogs get a full page; changelog and what&apos;s-new entries also
                appear on the homepage badge.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="post-slug">Slug</FieldLabel>
              <Input
                id="post-slug"
                value={draft.slug}
                maxLength={200}
                onChange={(event) => update("slug", event.target.value)}
                placeholder="auto-generated-from-title"
              />
              <FieldDescription>
                Leave blank to generate it from the title.
              </FieldDescription>
            </Field>

            {draft.type !== "blog" ? (
              <Field>
                <FieldLabel htmlFor="post-version">Version</FieldLabel>
                <Input
                  id="post-version"
                  value={draft.version}
                  maxLength={50}
                  onChange={(event) => update("version", event.target.value)}
                  placeholder="v1.2.0"
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="post-author">Author</FieldLabel>
              <Input
                id="post-author"
                value={draft.author}
                maxLength={120}
                onChange={(event) => update("author", event.target.value)}
                placeholder="Display name"
              />
            </Field>

            <Field>
              <FieldLabel>Published</FieldLabel>
              <div className="flex h-9 items-center gap-2">
                <Switch
                  checked={draft.published}
                  onCheckedChange={(checked) => update("published", checked)}
                  aria-label="Published"
                />
                <span className="text-muted-foreground text-sm">
                  {draft.published
                    ? "Visible to everyone"
                    : "Draft — hidden from the site"}
                </span>
              </div>
            </Field>

            <FormError message={error} />

            <Button disabled={pending || uploading} onClick={save}>
              {pending ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={FloppyDiskIcon} />
              )}
              {post ? "Save post" : "Create post"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{post?.title}” will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" disabled={deleting} onClick={remove}>
              {deleting ? <Spinner className="size-4" /> : null}
              Delete post
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
