"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  Server,
  Activity,
  RefreshCw,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  getAdminStats,
} from "@/actions/adminValues";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const t = useTranslations("DashboardPages.admin.dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    systemLoad: "...",
    securityEvents: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await getAdminStats();
      setStats((prev) => ({ ...prev, ...statsData }));
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="secondary" className="shadow-sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? t("actions.refreshing") : t("actions.refreshData")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("cards.totalUsers.title")}</CardTitle>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight mt-1">{stats.totalUsers.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("cards.totalUsers.description")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("cards.activeSessions.title")}</CardTitle>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight mt-1">{stats.activeSessions.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("cards.activeSessions.description")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("cards.systemLoad.title")}</CardTitle>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-full">
              <Server className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight mt-1">{stats.systemLoad}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("cards.systemLoad.description")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("cards.securityEvents.title")}</CardTitle>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-full">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight mt-1">{stats.securityEvents}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("cards.securityEvents.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-1 lg:col-span-4 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>{t("activityMap.title")}</CardTitle>
            <CardDescription>{t("activityMap.description")}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-75 flex items-center justify-center border-t border-border/50 mt-2 bg-muted/10 rounded-b-xl">
            <div className="text-muted-foreground flex items-center flex-col gap-3">
               <BarChart3 className="h-10 w-10 text-neutral-400" />
               <span className="text-sm font-medium">{t("activityMap.pending")}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-3 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>{t("quickActions.title")}</CardTitle>
            <CardDescription>{t("quickActions.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-12">
              <Users className="mr-3 h-4 w-4 text-muted-foreground" />
              {t("quickActions.manageUsers")}
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <ShieldCheck className="mr-3 h-4 w-4 text-muted-foreground" />
              {t("quickActions.securityLogs")}
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
              {t("quickActions.systemSettings")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

