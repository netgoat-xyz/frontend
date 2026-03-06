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
  List as ListIcon
} from "lucide-react";
import { deletePost } from "@/actions/content";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function ContentManager({ 
  initialData, 
  type, 
  page 
}: { 
  initialData: any, 
  type: string, 
  page: number 
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePost(deletingId);
      toast.success("Post deleted permanently");
      setDeletingId(null);
      router.refresh(); 
    } catch (e) {
      toast.error("Failed to delete post");
    }
  };

  const handleTabChange = (val: string) => {
    router.push(`/admin/content?type=${val}` as any);
  };

  const filteredPosts = initialData.posts.filter((post: any) => 
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
  };

  const getTypeColor = (postType: string) => {
    switch(postType) {
      case 'blog': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'changelog': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      case 'whats-new': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      default: return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800';
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
        <Button onClick={() => router.push("/admin/content/new" as any)} size="lg" className="shadow-lg shadow-primary/20 rounded-full px-6 transition-all hover:scale-105 active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> New Article
        </Button>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center bg-card/50 p-3 rounded-2xl border border-border/50 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/40">
        <Tabs defaultValue={type} onValueChange={handleTabChange} className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          <TabsList className="bg-transparent h-auto p-1 gap-1">
            <TabsTrigger value="all" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">All Posts</TabsTrigger>
            <TabsTrigger value="blog" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">Blog</TabsTrigger>
            <TabsTrigger value="changelog" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">Changelog</TabsTrigger>
            <TabsTrigger value="whats-new" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">What's New</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full xl:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Search posts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/30 border-transparent rounded-xl focus-visible:ring-primary/30 focus-visible:bg-background transition-all hover:bg-muted/50 w-full"
            />
          </div>
          <div className="flex items-center bg-muted/30 p-1 rounded-xl shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "list" ? "bg-background shadow-sm text-primary hover:bg-background hover:text-primary" : "text-muted-foreground hover:text-foreground")}>
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" ? "bg-background shadow-sm text-primary hover:bg-background hover:text-primary" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filteredPosts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center p-16 mt-8 bg-card/30 border border-border/50 border-dashed rounded-[2rem] text-center backdrop-blur-sm">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
                <FileText className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No publications found</h3>
            <p className="text-muted-foreground max-w-sm mb-8 text-base">
                {searchQuery ? "We couldn't find any documents matching your search criteria. Try a different term." : "You haven't published anything here yet. Get started by writing your first article."}
            </p>
            {!searchQuery && (
                <Button onClick={() => router.push("/admin/content/new" as any)} variant="outline" className="rounded-full px-6 h-12 bg-background hover:bg-muted font-medium">
                    Create your first post
                </Button>
            )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
            <motion.div 
                key={viewMode}
                variants={container} 
                initial="hidden" 
                animate="show"
                className={cn(
                    "grid gap-4",
                    viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 flex flex-col"
                )}
            >
              {filteredPosts.map((post: any) => (
                <motion.div key={post._id} variants={item} layoutId={`post-${post._id}`}>
                    <div className={cn(
                        "group relative flex bg-card border border-border/40 hover:border-primary/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
                        viewMode === "grid" ? "flex-col h-full min-h-55" : "flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                    )}>
                        {/* Status indicator pill */}
                        <div className={cn(
                            "absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm backdrop-blur-md transition-colors",
                            post.published 
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30" 
                                : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20 group-hover:bg-neutral-500/20 group-hover:border-neutral-500/30"
                        )}>
                            {post.published ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {post.published ? "Published" : "Draft"}
                        </div>

                        <div className={cn(
                            "flex flex-col gap-3 flex-1",
                            viewMode === "grid" ? "mt-8 h-full flex flex-col" : "w-full min-w-0"
                        )}>
                            <div className="flex flex-col">
                                <Badge variant="outline" className={cn("w-fit mb-3 text-[10px] uppercase font-bold tracking-wider", getTypeColor(post.type))}>
                                    {post.type.replace("-", " ")}
                                </Badge>
                                <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 pr-16 sm:pr-0">
                                    {post.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md truncate max-w-50" title={post.slug}>
                                        /{post.slug}
                                    </span>
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center justify-between text-xs text-muted-foreground",
                                viewMode === "grid" ? "mt-auto pt-4 border-t border-border/40 group-hover:border-primary/20 transition-colors" : "sm:w-auto shrink-0 justify-end w-full sm:mt-0 mt-4 pt-4 sm:pt-0 border-t border-border/40 sm:border-0"
                            )}>
                                <div className="flex items-center gap-1.5 font-medium bg-muted/40 px-2 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger className={cn(
                                        buttonVariants({ variant: "ghost", size: "icon" }), 
                                        "h-8 w-8 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all data-[state=open]:opacity-100 data-[state=open]:bg-primary/10 data-[state=open]:text-primary focus:opacity-100 outline-none hover:bg-primary/5 hover:text-primary"
                                    )}>
                                        <MoreVertical className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem 
                                                onClick={() => router.push(`/admin/content/${post._id}` as any)} 
                                                className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary p-2.5"
                                            >
                                                <Edit className="mr-2 h-4 w-4" /> Edit Content
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border/50 my-1" />
                                            <DropdownMenuItem 
                                                onClick={() => setDeletingId(post._id)}
                                                className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive p-2.5"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Post...
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </motion.div>
              ))}
            </motion.div>
        </AnimatePresence>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl border-border/50 shadow-2xl p-0 overflow-hidden sm:max-w-106.25">
          <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
                <Trash2 className="w-8 h-8 text-destructive" />
             </div>
             <AlertDialogTitle className="text-xl font-bold">Delete Publication</AlertDialogTitle>
          </div>
          <div className="p-6 pt-4">
              <AlertDialogDescription className="text-center text-base">
                Are you completely sure? This will permanently remove the post from the database, and it cannot be recovered.
              </AlertDialogDescription>
          </div>
          <div className="p-4 bg-muted/30 border-t border-border/40 flex items-center justify-end gap-2">
            <AlertDialogCancel className="rounded-xl border-transparent hover:bg-muted/50">Cancel</AlertDialogCancel>
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
