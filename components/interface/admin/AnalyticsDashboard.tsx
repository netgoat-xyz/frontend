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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
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
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
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
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews}</div>
            <p className="text-xs text-muted-foreground">Total page loads</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
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
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
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
        <Card className="col-span-4 lg:col-span-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
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
        
        <Card className="col-span-3 lg:col-span-2 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
             <CardTitle>Devices</CardTitle>
             <CardDescription>By type</CardDescription>
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
        <Card className="col-span-3 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited paths.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPages?.length > 0 ? (
              <div className="h-62.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topPages}
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
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Main sources of traffic.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topReferrers?.length > 0 ? (
              <div className="h-62.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topReferrers}
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
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-6 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Page Speed Insights</CardTitle>
            <CardDescription>
              Performance metrics per page (Average values).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pagesPerformance?.length > 0 ? (
              <div className="h-75 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.pagesPerformance.slice(0, 5).map((p: any) => ({
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
                    <Bar dataKey="LCP" name="LCP (ms)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="FID" name="FID (ms)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="CLS_Scaled" name="CLS (x1000)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-8 text-center flex items-center justify-center h-75">
                No web vitals data collected yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
