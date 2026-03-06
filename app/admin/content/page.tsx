import { getAdminPosts } from "@/actions/content";
import ContentManager from "@/components/interface/admin/ContentManager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const type = (searchParams.type as string) || "all";
  const page = parseInt((searchParams.page as string) || "1");
  
  const data = await getAdminPosts(type, page);
  
  return <ContentManager initialData={data} type={type} page={page} />;
}
