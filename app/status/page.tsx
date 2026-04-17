import { Suspense } from "react";
import Header from "@/components/interface/homescreen/header";
import Footer from "@/components/interface/homescreen/footer";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import { getPublicStatus } from "@/actions/status";
import { getIncidents } from "@/actions/incidents";
import type { ServiceStatus } from "@/actions/status";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Clock,
  Globe,
  Shield,
  Server,
  BookOpen,
  Wifi,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export const revalidate = 30;

const statusConfig = {
  operational: {
    color: "text-emerald-400",
    bg: "bg-emerald-400",
    bgSoft: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  degraded: {
    color: "text-amber-400",
    bg: "bg-amber-400",
    bgSoft: "bg-amber-500/10 border-amber-500/20",
    icon: AlertTriangle,
  },
  outage: {
    color: "text-red-400",
    bg: "bg-red-400",
    bgSoft: "bg-red-500/10 border-red-500/20",
    icon: XCircle,
  },
  maintenance: {
    color: "text-blue-400",
    bg: "bg-blue-400",
    bgSoft: "bg-blue-500/10 border-blue-500/20",
    icon: Wrench,
  },
} as const;

const serviceIcons: Record<ServiceStatus["key"], typeof Server> = {
  webApplication: Globe,
  api: Server,
  documentation: BookOpen,
  edgeNetwork: Wifi,
  authentication: Shield,
};

export default function StatusPage() {
  const t = useTranslations("HomePage.statusPage");

  return (
    <ShaderBackground>
      <div className="min-h-svh w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 container mx-auto px-4 md:px-6 pt-16 pb-24 z-10 max-w-3xl">
          <div className="flex flex-col items-center w-full text-center space-y-5 mb-20">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <Activity className="w-3 h-3 text-emerald-400 mr-2" />
              <span className="text-white/70 text-xs font-light">
                {t("title")}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="text-sm md:text-base max-w-md text-white/50 leading-relaxed font-light">
              {t("description")}
            </p>
            <div className="w-16 h-px bg-linear-to-r from-transparent via-white/20 to-transparent mt-4" />
          </div>

          <Suspense fallback={<StatusSkeleton />}>
            <StatusContent />
          </Suspense>
        </main>

        <Footer />
      </div>
    </ShaderBackground>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/6 bg-white/2 p-6">
        <Skeleton className="h-6 w-40 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-60 bg-white/10" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/6 bg-white/2 p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-48 bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

async function StatusContent() {
  const [status, incidentsArray] = await Promise.all([
    getPublicStatus(),
    getIncidents(),
  ]);
  const t = await getTranslations("HomePage.statusPage");

  const translateIncidentStatus = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === "investigating") return t("incidentStatus.investigating");
    if (normalized === "identified") return t("incidentStatus.identified");
    if (normalized === "monitoring") return t("incidentStatus.monitoring");
    if (normalized === "resolved") return t("incidentStatus.resolved");
    return value;
  };

  const translateIncidentSeverity = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === "critical") return t("incidentSeverity.critical");
    if (normalized === "major") return t("incidentSeverity.major");
    if (normalized === "minor") return t("incidentSeverity.minor");
    if (normalized === "low") return t("incidentSeverity.low");
    return value;
  };

  // Adjust overall status if there are active severe incidents
  let effectiveOverall = status.overall;
  const activeIncidents = incidentsArray.filter((inc: any) => inc.active);
  if (activeIncidents.some((inc: any) => inc.severity === "critical")) {
    effectiveOverall = "outage";
  } else if (activeIncidents.some((inc: any) => inc.severity === "major")) {
    effectiveOverall = "degraded";
  }

  const overallCfg =
    statusConfig[
      effectiveOverall as "operational" | "degraded" | "outage" | "maintenance"
    ];
  const OverallIcon = overallCfg.icon;

  return (
    <div className="space-y-8">
      <div
        className={`rounded-2xl border ${overallCfg.bgSoft} backdrop-blur-sm p-6 md:p-8`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${overallCfg.bgSoft} flex items-center justify-center`}
          >
            <OverallIcon className={`w-6 h-6 ${overallCfg.color}`} />
          </div>
          <div>
            <h2 className={`text-xl font-light ${overallCfg.color}`}>
              {effectiveOverall === "operational"
                ? t("statuses.operational")
                : effectiveOverall === "degraded"
                  ? t("statuses.degraded")
                  : effectiveOverall === "outage"
                    ? t("statuses.outage")
                    : t("statuses.maintenance")}
            </h2>
            <p className="text-xs text-white/30 mt-1 font-light">
              {t("labels.lastChecked")}{" "}
              {new Date(status.checkedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] font-light text-white/30 uppercase tracking-[0.2em] px-1 mb-4">
          {t("labels.services")}
        </h3>
        {status.services.map((service) => (
          <ServiceRow key={service.key} service={service} />
        ))}
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm p-6 md:p-8 space-y-6">
        <h3 className="text-[11px] font-light text-white/30 uppercase tracking-[0.2em]">
          {t("labels.infrastructure")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="text-2xl font-extralight text-white tracking-tight">
              {status.uptime}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25 font-light">
              <Clock className="w-3 h-3" />
              {t("labels.uptime")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extralight text-white tracking-tight">
              {status.services.filter((s) => s.status === "operational").length}
              /{status.services.length}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25 font-light">
              <CheckCircle2 className="w-3 h-3" />
              {t("labels.servicesHealthy")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extralight text-white tracking-tight">
              &lt;100ms
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25 font-light">
              <Activity className="w-3 h-3" />
              {t("labels.avgResponse")}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm p-6 md:p-8">
        <h3 className="text-[11px] font-light text-white/30 uppercase tracking-[0.2em] mb-6">
          {t("labels.recentIncidents")}
        </h3>
        {incidentsArray.length > 0 ? (
          <div className="space-y-6">
            {incidentsArray.map((inc: any) => (
              <div
                key={inc._id}
                className="border-b border-white/5 pb-6 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white/90 text-sm font-medium">
                    {inc.title}
                  </h4>
                  <div className="flex gap-2 items-center">
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
                        inc.active
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {inc.active
                        ? t("incidents.active")
                        : t("incidents.resolved")}
                    </span>
                    <span className="text-[10px] text-white/30 capitalize pr-2">
                      {translateIncidentStatus(inc.status)} • {translateIncidentSeverity(inc.severity)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/50 mb-3">{inc.description}</p>
                <div className="text-[10px] text-white/30 font-light flex gap-4">
                  <span>
                    {t("incidents.started")}: {new Date(inc.createdAt).toLocaleString()}
                  </span>
                  {inc.resolvedAt && (
                    <span>
                      {t("incidents.resolvedAt")}: {new Date(inc.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/20 mb-4" />
            <p className="text-sm text-white/30 font-light">
              {t("incidents.none")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  const t = useTranslations("HomePage.statusPage");
  const cfg = statusConfig[service.status];
  const StatusIcon = cfg.icon;
  const ServiceIcon = serviceIcons[service.key] || Server;

  return (
    <div className="rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 backdrop-blur-sm p-4 md:p-5 flex items-center justify-between gap-4 transition-all duration-300 group">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/3 border border-white/6 flex items-center justify-center shrink-0">
          <ServiceIcon className="w-4 h-4 text-white/40" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-light text-white/80 truncate">
            {t(`services.${service.key}.name`)}
          </p>
          <p className="text-xs text-white/25 font-light truncate">
            {t(`services.${service.key}.description`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {service.latency !== undefined && (
          <span className="text-[11px] text-white/20 font-light tabular-nums hidden sm:inline">
            {service.latency}ms
          </span>
        )}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.bgSoft}`}
        >
          <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
          <span className={cfg.color}>{t(`statuses.${service.status}`)}</span>
        </div>
      </div>
    </div>
  );
}
