import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentEditor } from "@/components/admin/content-editor";
import { getAdminPostById } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminPostById(id);
  if (!post) notFound();

  return <ContentEditor post={post} />;
}
