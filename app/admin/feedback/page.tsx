import type { Metadata } from "next";

import { FeedbackManager } from "@/components/admin/feedback-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { listFeedback } from "@/lib/data/feedback";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/models/Feedback";

export const metadata: Metadata = {
  title: "Feedback",
};

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;

  const status: FeedbackStatus | "all" = (
    FEEDBACK_STATUSES as readonly string[]
  ).includes(params.status ?? "")
    ? (params.status as FeedbackStatus)
    : "all";

  const parsedPage = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await listFeedback({ status, page });

  return (
    <>
      <PageHeader
        title="Feedback"
        description="Everything users send through the feedback action, triaged by status. The old console captured feedback but had no way to read it."
      />
      <FeedbackManager page={result} status={status} />
    </>
  );
}
