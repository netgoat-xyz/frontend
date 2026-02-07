"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function WhatsNewPopup({ post }: { post: any }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!post) return;

    const lastSeenId = localStorage.getItem("netgoat_whats_new_last_id");
    if (lastSeenId !== post._id) {
        // Delay slightly for dramatic effect
        const t = setTimeout(() => setOpen(true), 1000);
        return () => clearTimeout(t);
    }
  }, [post]);

  const handleClose = (openState: boolean) => {
    if (!openState && post) {
        localStorage.setItem("netgoat_whats_new_last_id", post._id);
        setOpen(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="px-2 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1 inline" /> New Update
            </Badge>
            {post.version && <Badge variant="outline">{post.version}</Badge>}
          </div>
          <DialogTitle className="text-2xl">{post.title}</DialogTitle>
          <DialogDescription>
            Check out what's new in NetGoat.
          </DialogDescription>
        </DialogHeader>
        
        {post.coverImage && (
            <div className="w-full relative rounded-lg overflow-hidden border border-neutral-800 my-4">
                 <img src={post.coverImage} alt={post.title} className="w-full h-auto max-h-64 object-cover" />
            </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none border-t border-neutral-800 py-4">
            <Markdown>{post.content}</Markdown>
        </div>

        <DialogFooter>
          <Button onClick={() => handleClose(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
