import ContentEditor from "@/components/interface/admin/ContentEditor";
import { getPostById } from "@/actions/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminEditContentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const post = await getPostById(params.id);
  
  if (!post) {
    notFound();
  }

  return <ContentEditor post={post} />;
}
