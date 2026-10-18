import type { Metadata } from "next";

import { LogsViewer } from "@/components/admin/logs-viewer";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Logs",
};

export default function AdminLogsPage() {
  return (
    <>
      <PageHeader
        title="Logs"
        description="A live tail of this server process's console output, captured in a bounded ring buffer."
      />
      <LogsViewer />
    </>
  );
}
