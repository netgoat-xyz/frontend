"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createPost, updatePost } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function ContentEditor({ post }: { post?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentType, setContentType] = useState(post?.type || "blog");

  const { register, handleSubmit, setValue, watch, formState: { errors }, getValues } = useForm({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      type: post?.type || "blog",
      version: post?.version || "",
      published: post?.published || false,
      coverImage: post?.coverImage || "",
    }
  });

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error(e);
      toast.error("Image upload failed");
      return null;
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        
        setUploading(true);
        toast.info("Uploading pasted image...");
        const url = await handleFileUpload(file);
        setUploading(false);

        if (url) {
           const currentContent = getValues("content");
           // Simple append for now if we can't easily determine cursor
           // But better to attempt text insertion at cursor if possible, 
           // though React state updates make it tricky without refs.
           // However, let's try to access the element via event target
           const textarea = e.currentTarget as HTMLTextAreaElement;
           const start = textarea.selectionStart;
           const end = textarea.selectionEnd;
           
           const before = currentContent.substring(0, start);
           const after = currentContent.substring(end, currentContent.length);
           const insertion = `\n![Image](${url})\n`;
           
           setValue("content", before + insertion + after, { shouldDirty: true });
           toast.success("Image uploaded!");
        }
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      setUploading(true);
      const url = await handleFileUpload(file);
      setUploading(false);
      
      if(url) {
          setValue("coverImage", url, { shouldDirty: true });
          toast.success("Banner uploaded!");
      }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (post?._id) {
        await updatePost(post._id, data);
        toast.success("Post updated successfully");
      } else {
        await createPost(data);
        toast.success("Post created successfully");
        router.push("/admin/content" as any);
      }
    } catch (error) {
        console.error(error);
      toast.error("Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{post ? "Edit Post" : "Create New Post"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Post Details</CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...register("title", { required: true })} placeholder="Post title" />
                    {errors.title && <span className="text-red-500 text-sm">Title is required</span>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                        value={contentType} 
                        onValueChange={(val) => {
                            setContentType(val);
                            setValue("type", val);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="blog">Blog Post</SelectItem>
                            <SelectItem value="changelog">Changelog</SelectItem>
                            <SelectItem value="whats-new">What's New</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="slug">Slug {contentType === "blog" && "(URL Path)"}</Label>
                    <Input id="slug" {...register("slug")} placeholder="auto-generated-from-title" />
                </div>
                
                {(contentType === "changelog" || contentType === "whats-new") && (
                    <div className="space-y-2">
                        <Label htmlFor="version">Version</Label>
                        <Input id="version" {...register("version")} placeholder="v1.0.0" />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="coverImage">Banner Image</Label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input id="coverImage" {...register("coverImage")} placeholder="https://example.com/image.png" />
                    </div>
                    <div className="relative">
                        <Input 
                            type="file" 
                            id="banner-upload"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            onChange={handleBannerUpload} 
                            accept="image/*"
                            disabled={uploading}
                        />
                         <Button type="button" variant="outline" disabled={uploading}>
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Upload"
                            )}
                        </Button>
                    </div>
                </div>
                {watch("coverImage") && (
                    <div className="mt-2 relative w-full h-48 bg-muted rounded-md overflow-hidden border">
                         <img 
                            src={watch("coverImage")} 
                            alt="Banner preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea 
                id="content" 
                {...register("content", { required: true })} 
                className="font-mono min-h-100" 
                placeholder="# Hello World (Paste images here supported)"
                onPaste={handlePaste}
              />
              {errors.content && <span className="text-red-500 text-sm">Content is required</span>}
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
               <Switch 
                    id="published" 
                    checked={watch("published")}
                    onCheckedChange={(checked) => setValue("published", checked)}
               />
               <Label htmlFor="published">Published</Label>
            </div>

          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-neutral-500">
                {post ? `Last updated: ${new Date(post.updatedAt).toLocaleString()}` : ""}
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Post
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
