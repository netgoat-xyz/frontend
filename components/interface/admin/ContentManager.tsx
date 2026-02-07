"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { deletePost } from "@/actions/content";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Skeleton } from "@/components/ui/skeleton";

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

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePost(deletingId);
      toast.success("Post deleted successfully");
      setDeletingId(null);
      router.refresh(); // Refresh server data
    } catch (e) {
      toast.error("Failed to delete post");
    }
  };

  const handleTabChange = (val: string) => {
    router.push(`/admin/content?type=${val}` as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
        <Button onClick={() => router.push("/admin/content/new" as any)}>
          <Plus className="mr-2 h-4 w-4" /> Create New
        </Button>
      </div>

      <Tabs defaultValue={type} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="whats-new">What's New</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>Manage your blog posts, changelogs, and announcements.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.posts.map((post: any) => (
                <TableRow key={post._id}>
                  <TableCell className="font-medium">
                    {post.title}
                    {post.slug && <div className="text-xs text-neutral-500">/{post.slug}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{post.type.replace("-", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {post.published ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Published</Badge>
                    ) : (
                        <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 p-0")}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/admin/content/${post._id}` as any)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                              className="text-red-600 focus:bg-red-500/10"
                              onClick={() => setDeletingId(post._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {initialData.posts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-neutral-500">
                        No content found. Create your first post!
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination could go here */}
          
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
