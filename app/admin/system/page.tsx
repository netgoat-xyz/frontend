"use client";

import { useEffect, useState } from "react";
import {
  Power,
} from "lucide-react";
import {
  getSystemSpecs,
  adminRestartSystem
} from "@/actions/adminValues";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemSpecs {
  os: string;
  cpuModel: string;
  cpuCount: number;
  memoryTotal: string;
  memoryFree: string;
  uptime: string;
}

export default function AdminSystemPage() {
  const t = useTranslations("DashboardPages.admin.system");
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);

  useEffect(() => {
    const fetchSystemSpecs = async () => {
        try {
          const data = await getSystemSpecs();
          setSystemSpecs(data);
        } catch {
          toast.error(t("toasts.fetchFailed"));
        }
      };
    fetchSystemSpecs();
  }, [t]);

  const handleRestart = async () => {
    if(!confirm(t("confirmRestart"))) return;
    try {
      await adminRestartSystem();
      toast.success(t("toasts.restartSent"));
    } catch (error) {
      console.log(error)
      toast.error(t("toasts.restartFailed"));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="destructive" onClick={handleRestart} className="shadow-sm">
            <Power className="mr-2 h-4 w-4"/> {t("actions.restartSystem")}
        </Button>
      </div>

    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
    <CardHeader>
        <CardTitle>{t("hardware.title")}</CardTitle>
        <CardDescription>{t("hardware.description")}</CardDescription>
    </CardHeader>
    <CardContent>
        {systemSpecs ? (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.os")}</span>
                <span>{systemSpecs.os}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.cpuModel")}</span>
                <span>{systemSpecs.cpuModel}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.cpuCores")}</span>
                <span>{systemSpecs.cpuCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.memoryTotal")}</span>
                <span>{systemSpecs.memoryTotal}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.memoryFree")}</span>
                <span>{systemSpecs.memoryFree}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">{t("hardware.fields.uptime")}</span>
                <span>{systemSpecs.uptime}</span>
            </div>
        </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="flex justify-between border-b pb-2">
                        <Skeleton className="h-5 w-25" />
                        <Skeleton className="h-5 w-37.5" />
                    </div>
                ))}
            </div>
        )}
    </CardContent>
    </Card>
    </div>
  );
}
