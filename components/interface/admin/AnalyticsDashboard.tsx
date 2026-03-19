"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Eye, MousePointerClick, Zap, Laptop, Smartphone, Tablet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface DeviceStat {
  device: string;
  count: number;
}

interface DeviceChartItem {
  name: string;
  value: number;
  rawDevice: string;
}

interface ChartPoint {
  date: string;
  views: number;
}

interface TopPage {
  path: string;
  count: number;
}

interface TopReferrer {
  url: string;
  count: number;
}

interface PagePerformance {
  path: string;
  metrics: {
    LCP: number;
    FID: number;
    CLS: number;
  };
}

interface AnalyticsStats {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  webVitals: {
    lcp: number;
  };
  chartData: ChartPoint[];
  deviceStats?: DeviceStat[];
  topPages?: TopPage[];
  topReferrers?: TopReferrer[];
  pagesPerformance?: PagePerformance[];
}

function getDeviceIcon(device: string) {
  switch (device.toLowerCase()) {
    case "mobile": return <Smartphone className="h-4 w-4" />;
    case "tablet": return <Tablet className="h-4 w-4" />;
    default: return <Laptop className="h-4 w-4" />;
  }
}

export default function AnalyticsDashboard({
  stats,
  timeRange,
}: {
  stats: AnalyticsStats;
  timeRange: string;
}) {
  const router = useRouter();
  const t = useTranslations("DashboardPages.admin.analytics");

  const getDeviceLabel = (device: string) => {
    const normalized = device.toLowerCase();
    if (normalized === "mobile") return t("devices.labels.mobile");
    if (normalized === "tablet") return t("devices.labels.tablet");
    return t("devices.labels.desktop");
  };

  const topPages = stats.topPages ?? [];
  const topReferrers = stats.topReferrers ?? [];
  const pagesPerformance = stats.pagesPerformance ?? [];
  
  // Format device data for chart
  const deviceData: DeviceChartItem[] = stats.deviceStats?.map((d) => ({
    name: getDeviceLabel(d.device),
    value: d.count,
    rawDevice: d.device
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v) =>
            router.push(`/admin/analytics?range=${v}`)
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder={t("selectRange")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{t("ranges.24h")}</SelectItem>
            <SelectItem value="7d">{t("ranges.7d")}</SelectItem>
            <SelectItem value="30d">{t("ranges.30d")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.totalVisitors.title")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitors}</div>
            <p className="text-xs text-muted-foreground">{t("cards.totalVisitors.description")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("cards.pageViews.title")}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews}</div>
            <p className="text-xs text-muted-foreground">{t("cards.pageViews.description")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("cards.bounceRate.title")}</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {t("cards.bounceRate.description")}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("cards.avgLcp.title")}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.webVitals.lcp.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cards.avgLcp.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t("overview.title")}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-75 w-full">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f1f1f",
                      border: "none",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                    vertical={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 lg:col-span-2 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
             <CardTitle>{t("devices.title")}</CardTitle>
             <CardDescription>{t("devices.description")}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-62.5 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: "#1f1f1f", border: "none" }}
                       itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.visitors}</div>
                        <div className="text-xs text-muted-foreground">{t("devices.visitors")}</div>
                    </div>
                </div>
             </div>
             <div className="mt-4 space-y-2">
                {deviceData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            {getDeviceIcon(entry.rawDevice)}
                            <span>{getDeviceLabel(entry.rawDevice)}</span>
                        </div>
                        <div className="font-medium">{entry.value}</div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="col-span-3 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t("topPages.title")}</CardTitle>
            <CardDescription>{t("topPages.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="h-62.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPages}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="path" 
                      width={120} 
                      tick={{ fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-8 text-center flex items-center justify-center h-62.5">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t("topReferrers.title")}</CardTitle>
            <CardDescription>{t("topReferrers.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length > 0 ? (
              <div className="h-62.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topReferrers}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="url" 
                      width={120} 
                      tick={{ fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-8 text-center flex items-center justify-center h-62.5">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-6 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t("pageSpeed.title")}</CardTitle>
            <CardDescription>
              {t("pageSpeed.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pagesPerformance.length > 0 ? (
              <div className="h-75 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pagesPerformance.slice(0, 5).map((p) => ({
                      path: p.path,
                      LCP: p.metrics.LCP,
                      FID: p.metrics.FID,
                      CLS_Scaled: p.metrics.CLS * 1000 // scale CLS for visibility alongside ms metrics
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="path" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="LCP" name={t("pageSpeed.legend.lcp")} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="FID" name={t("pageSpeed.legend.fid")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="CLS_Scaled" name={t("pageSpeed.legend.cls")} fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-8 text-center flex items-center justify-center h-75">
                {t("noWebVitals")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
