'use client'

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DomainCard from "./components/domainCard";
import { listTeamDomains } from "@/actions/teamDomains";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DomainStatusFilter, DomainsViewMode } from "./dashboardDomainsPanel";
import { useTranslations } from "next-intl";

type DomainsSectionProps = {
  searchQuery?: string;
  viewMode?: DomainsViewMode;
  statusFilter?: DomainStatusFilter;
};

export default function DomainsSection({
  searchQuery = "",
  viewMode = "grid",
  statusFilter = "all",
}: DomainsSectionProps) {
  const t = useTranslations("DashboardPages.homeDomains");
  const params = useParams();
  const teamSlug = params.teamName as string;
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = useCallback((date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t("time.today");
    if (diffInDays === 1) return t("time.daysAgo", { count: 1 });
    if (diffInDays < 30) return t("time.daysAgo", { count: diffInDays });
    return t("time.monthsAgo", { count: Math.floor(diffInDays / 30) });
  }, [t]);

  useEffect(() => {
    if (teamSlug) {
      loadDomains();
    }
  }, [teamSlug]);

  const loadDomains = useCallback(async () => {
    try {
      setLoading(true);
      const result = await listTeamDomains(teamSlug);
      setDomains(result as any[]);
    } catch (error) {
      console.error("Failed to load domains:", error);
    } finally {
      setLoading(false);
    }
  }, [teamSlug]);

  // Transform domains to match DomainCard expected format
  const transformedDomains = useMemo(() => domains.map((domain) => ({
    name: domain.domain,
    status: domain.verified && domain.active ? "Valid" : domain.verified ? "Inactive" : "Invalid Configuration",
    group: domain.active ? "Production" : "Preview",
    isStarred: false,
    updatedAt: formatTimeAgo(domain.updated_at || domain.created_at),
    pathName: `/dashboard/${teamSlug}/${domain.domain}`,
    verified: domain.verified,
    verificationToken: domain.verification_token,
    lastVerificationCheck: domain.last_verification_check,
    verificationAttempts: domain.verification_attempts || 0,
    teamSlug: teamSlug
  })), [domains, teamSlug, formatTimeAgo]);

  const filteredDomains = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return transformedDomains.filter((domain) => {
      const matchesSearch = !normalizedSearch || domain.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && Boolean(domain.verified)) ||
        (statusFilter === "needs-verification" && !domain.verified);

      return matchesSearch && matchesStatus;
    });
  }, [transformedDomains, searchQuery, statusFilter]);

  const visibleDomains = useMemo(() => filteredDomains.slice(0, 4), [filteredDomains]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className={viewMode === "list" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
          {[1, 2].map((i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48 bg-neutral-800" />
                    <Skeleton className="h-4 w-32 bg-neutral-800" />
                  </div>
                  <Skeleton className="h-4 w-4 bg-neutral-800" />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-20 bg-neutral-800" />
                    <Skeleton className="h-8 w-20 bg-neutral-800" />
                  </div>
                  <Skeleton className="h-8 w-16 bg-neutral-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredDomains.length === 0 && domains.length > 0) {
    return (
      <div className="w-full mt-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <h3 className="text-base font-semibold text-neutral-100">{t("noMatchingTitle")}</h3>
            <p className="text-sm text-neutral-400">
              {t("noMatchingDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (domains.length === 0) {
    return (
      <div className="w-full mt-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
              <Globe className="w-8 h-8 text-neutral-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                {t("emptyTitle")}
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                {t("emptyDescription")}
              </p>
            </div>
            <Link href={`/dashboard/${teamSlug}/new`}>
              <Button className="bg-neutral-100 text-neutral-900 hover:bg-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("actions.createDomain")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <div className={viewMode === "list" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        {visibleDomains.map((domain, index) => (
          <DomainCard 
            key={index} 
            domain={domain}
            onVerified={loadDomains}
          />
        ))}
      </div>
      {filteredDomains.length > 4 && (
        <div className="mt-4 text-center">
          <Link href={`/dashboard/${teamSlug}/domains`}>
            <Button variant="outline" className="text-neutral-400 hover:text-neutral-100">
              {t("actions.viewAll", { count: filteredDomains.length })}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
