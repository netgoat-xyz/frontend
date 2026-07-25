"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Calendar,
  Search,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { deletePost } from "@/actions/content";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ContentPost = {
  _id: string;
  title?: string;
  slug?: string;
  type: string;
  published: boolean;
  createdAt: string | Date;
};

type ContentManagerProps = {
  initialData: { posts: ContentPost[] };
  type: string;
  page: number;
};

export default function ContentManager({
  initialData,
  type,
}: ContentManagerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePost(deletingId);
      toast.success("Post deleted permanently");
      setDeletingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleTabChange = (val: string) => {
    router.push(`/admin/content?type=${val}`);
  };

  const filteredPosts = initialData.posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTypeColor = (postType: string) => {
    switch (postType) {
      case "blog":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      case "changelog":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50";
      case "whats-new":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      default:
        return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800";
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Publications
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium">
            Manage your blog posts, changelogs, and announcements
          </p>
        </div>
        <button
          className="cursor-pointer text-sm font-medium bg-neutral-100 text-neutral-900 px-7 py-2.5 rounded-md hover:bg-neutral-300 transition-colors"
          onClick={() => router.push("/admin/content/new")}
        >
          New Article
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col xl:flex-row justify-between gap-3 w-full items-start xl:items-center">
        {/* Tabs styled like the reference filters/buttons */}
        <Tabs
          defaultValue={type}
          onValueChange={handleTabChange}
          className="w-full xl:w-auto"
        >
          <TabsList className="flex w-full xl:w-auto justify-start bg-neutral-900 border border-neutral-800 rounded-md p-1 gap-1 h-auto">
            <TabsTrigger
              value="all"
              className="px-3 py-1.5 text-sm text-neutral-400 rounded-md transition-all data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-neutral-300"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="px-3 py-1.5 text-sm text-neutral-400 rounded-md transition-all data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-neutral-300"
            >
              Blog
            </TabsTrigger>
            <TabsTrigger
              value="changelog"
              className="px-3 py-1.5 text-sm text-neutral-400 rounded-md transition-all data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-neutral-300"
            >
              Changelog
            </TabsTrigger>
            <TabsTrigger
              value="whats-new"
              className="px-3 py-1.5 text-sm text-neutral-400 rounded-md transition-all data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-neutral-300"
            >
              What&apos;s New
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-row items-center gap-2 w-full xl:w-auto">
          {/* Search Input Group */}
          <div className="relative flex-1 xl:w-72 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-white transition-colors">
              <Search className="size-5" />
            </div>
            <input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-all"
            />
          </div>

          {/* View Switcher (Desktop) */}
          <div className="hidden lg:flex bg-neutral-900 border border-neutral-800 rounded-md p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <LayoutGrid className="size-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <ListIcon className="size-5" />
            </button>
          </div>

          {/* View Switcher (Mobile Toggle) */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="lg:hidden flex items-center justify-center p-2 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            {viewMode === "grid" ? (
              <ListIcon className="size-5" />
            ) : (
              <LayoutGrid className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full mt-8">
        {filteredPosts.length === 0 ? (
          searchQuery ? (
            /* Empty State: No Search Results */
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <h3 className="text-base font-semibold text-neutral-100">
                  No matching posts
                </h3>
                <p className="text-sm text-neutral-400">
                  We couldn&apos;t find any documents matching &quot;{searchQuery}&quot;. Try a
                  different term.
                </p>
              </div>
            </div>
          ) : (
            /* Empty State: No Content Published */
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-neutral-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                    No publications found
                  </h3>
                  <p className="text-sm text-neutral-400 mb-6 max-w-sm mx-auto">
                    You haven&apos;t published anything here yet. Get started by
                    writing your first article.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/admin/content/new")}
                  className="bg-neutral-100 text-neutral-900 hover:bg-white transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first post
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Data Grid / List View */
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "grid grid-cols-1 gap-4",
            )}
          >
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                className={cn(
                  "group flex bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-all",
                  viewMode === "grid"
                    ? "flex-col h-full min-h-[220px]"
                    : "flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-3 flex-1",
                    viewMode === "grid"
                      ? "h-full flex flex-col"
                      : "w-full min-w-0",
                  )}
                >
                  {/* Header: Type and Status */}
                  <div className="flex justify-between items-start">
                    <span
                      className={cn(
                        "text-[10px] uppercase font-bold tracking-wider",
                        getTypeColor(post.type),
                      )}
                    >
                      {post.type.replace("-", " ")}
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border",
                        post.published
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700",
                      )}
                    >
                      {post.published ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {post.published ? "Published" : "Draft"}
                    </div>
                  </div>

                  {/* Title and Slug */}
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-neutral-100 leading-tight group-hover:text-white transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
                      <span
                        className="font-mono text-[11px] truncate max-w-[200px]"
                        title={post.slug}
                      >
                        /{post.slug}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Date and Actions */}
                  <div
                    className={cn(
                      "flex items-center justify-between text-xs text-neutral-500",
                      viewMode === "grid"
                        ? "mt-auto pt-4 border-t border-neutral-800"
                        : "sm:w-auto shrink-0 justify-end w-full sm:mt-0 mt-4 pt-4 sm:pt-0 border-t border-neutral-800 sm:border-0",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "h-8 w-8 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100",
                        )}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 p-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/content/${post._id}`)
                          }
                          className="rounded-md cursor-pointer focus:bg-neutral-800 focus:text-neutral-100 p-2"
                        >
                          <Edit className="mr-2 h-4 w-4 hover:text-white" /> Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-800 my-1" />
                        <DropdownMenuItem
                          onClick={() => setDeletingId(post._id)}
                          className="rounded-md cursor-pointer focus:bg-red-400/10 focus:text-red-400 p-2"
                        >
                          <Trash2 className="mr-2 h-4 w-4 focus:text-red-400" /> Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-border/50 shadow-2xl p-0 overflow-hidden sm:max-w-106.25">
          <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">
              Delete Publication
            </AlertDialogTitle>
          </div>
          <div className="p-6 pt-4">
            <AlertDialogDescription className="text-center text-base">
              Are you completely sure? This will permanently remove the post
              from the database, and it cannot be recovered.
            </AlertDialogDescription>
          </div>
          <div className="p-4 bg-muted/30 border-t border-border/40 flex items-center justify-end gap-2">
            <AlertDialogCancel className="rounded-xl border-transparent hover:bg-muted/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:ring-destructive shadow-md shadow-destructive/20"
            >
              Permanently Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
