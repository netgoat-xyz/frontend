import type { Metadata } from "next";

import { ContentEditor } from "@/components/admin/content-editor";

export const metadata: Metadata = {
  title: "New post",
};

export default function NewPostPage() {
  return <ContentEditor />;
}
