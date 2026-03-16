'use client'

import { useState } from "react";
import ProjectToolbar from "./projectToolbar";
import DomainsSection from "./domainsCard";

export type DomainsViewMode = "grid" | "list";
export type DomainStatusFilter = "all" | "verified" | "needs-verification";

export default function DashboardDomainsPanel({ params }: { params: { teamName: string } }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<DomainsViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<DomainStatusFilter>("all");

  return (
    <>
      <ProjectToolbar
        params={params}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <DomainsSection
        searchQuery={searchQuery}
        viewMode={viewMode}
        statusFilter={statusFilter}
      />
    </>
  );
}