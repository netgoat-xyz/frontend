import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentManager } from "@/components/admin/content-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { listAdminPosts } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Content",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : "all";
  const parsedPage = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await listAdminPosts({ type, page });

  return (
    <>
      <PageHeader
        title="Content"
        description="Blog posts, changelogs and what's-new entries published from the same posts collection the site reads."
      >
        <Button size="sm" render={<Link href="/admin/content/new" />}>
          <HugeiconsIcon icon={PlusSignIcon} />
          New post
        </Button>
      </PageHeader>

      <ContentManager
        posts={result.posts}
        total={result.total}
        page={result.page}
        pages={result.pages}
        type={type}
      />
    </>
  );
}
