"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, Eye, MousePointerClick, Zap, Copy, Laptop, Smartphone, Tablet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

function getRatingColor(metric: string, value: number) {
  if (!value) return "text-muted-foreground";

  // Thresholds based on Web Vitals patterns
  const thresholds: any = {
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const t = thresholds[metric];
  if (!t) return "text-foreground";

  if (value <= t.good) return "text-green-500 font-medium";
  if (value >= t.poor) return "text-red-500 font-medium";
  return "text-yellow-500 font-medium";
}

function formatMetric(value: any, decimals = 0) {
  if (value === undefined || value === null) return "-";
  return typeof value === "number" ? value.toFixed(decimals) : value;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
  stats: any;
  timeRange: string;
}) {
  const router = useRouter();
  
  // Format device data for chart
  const deviceData = stats.deviceStats?.map((d: any) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.count,
    rawDevice: d.device
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Self-hosted insights and performance metrics.
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v) =>
            router.push(`/admin/analytics?range=${v}` as any)
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitors}</div>
            <p className="text-xs text-muted-foreground">Unique devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews}</div>
            <p className="text-xs text-muted-foreground">Total page loads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Single page sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg LCP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.webVitals.lcp.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Largest Contentful Paint
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
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
        
        <Card className="col-span-3 lg:col-span-2">
          <CardHeader>
             <CardTitle>Devices</CardTitle>
             <CardDescription>By type</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[250px] w-full relative">
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
                      {deviceData.map((entry: any, index: number) => (
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
                        <div className="text-xs text-muted-foreground">Visitors</div>
                    </div>
                </div>
             </div>
             <div className="mt-4 space-y-2">
                {deviceData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            {getDeviceIcon(entry.rawDevice)}
                            <span>{entry.name}</span>
                        </div>
                        <div className="font-medium">{entry.value}</div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited paths.</CardDescription>
          </CardHeader>
          <CardContent className="">
            <div className="space-y-2">
              {stats.topPages.map((page: any, i: number) => {
                const percentage =
                  stats.pageViews > 0
                    ? (page.count / stats.pageViews) * 100
                    : 0;

                return (
                  <div
                    key={i}
                    className="group select-text relative w-full "
                  >
                    <div className="relative h-8 rounded overflow-hidden p-0 w-full">
                      <div
                        className="absolute h-8 rounded pr-1 bg-neutral-200 dark:bg-neutral-800 opacity-40 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <div className="flex justify-between p-0 group/row px-3 h-8 items-center relative z-10">
                        <div className="relative flex items-center gap-2 overflow-hidden w-0 flex-1">
                          <span
                            className="text-left text-sm leading-8 w-full truncate font-medium"
                            title={page.path}
                          >
                            <a
                              href={`https://netgoat.xyz${page.path}`}
                              rel="noopener"
                              target="_blank"
                              className="hover:underline"
                            >
                              {page.path}
                            </a>
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center bg-background/50 backdrop-blur px-1 rounded">
                             <Copy className="w-3 h-3 text-muted-foreground mr-1" />
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="flex justify-end items-center">
                            <span className="text-right text-sm font-semibold">
                              {page.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.topPages.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 text-center">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Page Speed Insights</CardTitle>
          <CardDescription>
            Performance metrics per page (Average values).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="p-3 text-left font-medium">Path</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">
                    LCP
                  </th>
                  <th className="p-3 text-right font-medium text-muted-foreground">
                    FID
                  </th>
                  <th className="p-3 text-right font-medium text-muted-foreground">
                    CLS
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.pagesPerformance?.slice(0, 5).map((page: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/20"
                  >
                    <td className="p-3 font-medium truncate max-w-[150px]" title={page.path}>{page.path}</td>
                    <td
                      className={`p-3 text-right ${getRatingColor(
                        "LCP",
                        page.metrics.LCP
                      )}`}
                    >
                      {formatMetric(page.metrics.LCP)}ms
                    </td>
                    <td
                      className={`p-3 text-right ${getRatingColor(
                        "FID",
                        page.metrics.FID
                      )}`}
                    >
                      {formatMetric(page.metrics.FID)}ms
                    </td>
                     <td
                      className={`p-3 text-right ${getRatingColor(
                        "CLS",
                        page.metrics.CLS
                      )}`}
                    >
                      {formatMetric(page.metrics.CLS, 3)}
                    </td>
                  </tr>
                ))}
                {(!stats.pagesPerformance ||
                  stats.pagesPerformance.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No web vitals data collected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
