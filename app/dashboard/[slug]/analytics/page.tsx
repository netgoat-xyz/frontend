"use client";

import React, { useState, useMemo } from "react";
import { PageTitle } from "@/components/SiteTitle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDateRangeIcon } from "@heroicons/react/24/solid";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from "recharts";

type LineData = { name: string; Visitors: number };

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg p-3 text-sm shadow-lg bg-card border border-zinc-800 min-w-[160px]">
      <div className="font-semibold mb-1 text-white">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex justify-between text-gray-100">
          <span className="truncate mr-4">{entry.name}</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsReplica() {
  const [timeframe, setTimeframe] = useState<string>("7d");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const lineData: LineData[] = useMemo(() => [
    { name: "Sep 5", Visitors: 0 },
    { name: "Sep 6", Visitors: 70 },
    { name: "Sep 7", Visitors: 40 },
    { name: "Sep 8", Visitors: 50 },
    { name: "Sep 9", Visitors: 65 },
    { name: "Sep 10", Visitors: 45 },
    { name: "Sep 11", Visitors: 43 },
    { name: "Sep 12", Visitors: 30 },
  ], [timeframe]);

  return (
    <div className="flex flex-col flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle
          title="Reverse Proxies"
          subtitle="Reverse proxies your server:ip to a domain."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Subdomains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">all</SelectItem>
                    <SelectItem value="@">@</SelectItem>
                    <SelectItem value="www">www</SelectItem>
                    <SelectItem value="api">api</SelectItem>
                    <SelectItem value="canary">canary</SelectItem>
                    <SelectItem value="beta">beta</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarDateRangeIcon className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    onSelect={(d) => {
                      setDate(d);
                      setPopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Last 7 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="3mon">Last 3 Months</SelectItem>
                    <SelectItem value="12mon">Last 12 Months</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      {/* Metrics Cards */}
      <Card className="bg-card border border-zinc-800 shadow-sm rounded-xl">
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Visitors", value: "356", trend: "+1.6K%", trendColor: "text-green-500" },
              { label: "Page Views", value: "563", trend: "+1.8K%", trendColor: "text-green-500" },
              { label: "Bounce Rate", value: "71%", trend: "-2%", trendColor: "text-red-500" },
            ].map((metric) => (
              <div key={metric.label} className="bg-card/65 rounded-lg p-4 flex flex-col">
                <div className="text-sm text-gray-300">{metric.label}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-3xl font-bold text-white">{metric.value}</span>
                  <span className={`bg-white/10 px-2 py-1 rounded text-xs font-bold ${metric.trendColor}`}>{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Line Chart */}
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <ReTooltip content={<DarkTooltip />} />
              <Line type="linear" dataKey="Visitors" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pages & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="routes">
              <TabsList className="mb-4">
                <TabsTrigger value="routes">Routes</TabsTrigger>
                <TabsTrigger value="hostnames">Hostnames</TabsTrigger>
              </TabsList>

              <TabsContent value="routes">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { path: "/", visitors: 345 },
                      { path: "/register", visitors: 46 },
                      { path: "/dashboard", visitors: 41 },
                      { path: "/login", visitors: 7 },
                    ].map((row) => (
                      <TableRow key={row.path}>
                        <TableCell>{row.path}</TableCell>
                        <TableCell className="text-right">{row.visitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="hostnames">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostname</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { host: "app.duckbot.dev", visitors: 210 },
                      { host: "blog.duckbot.dev", visitors: 120 },
                      { host: "docs.duckbot.dev", visitors: 45 },
                    ].map((row) => (
                      <TableRow key={row.host}>
                        <TableCell>{row.host}</TableCell>
                        <TableCell className="text-right">{row.visitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="referrers">
              <TabsList className="mb-4">
                <TabsTrigger value="referrers">Referrers</TabsTrigger>
                <TabsTrigger value="utm">UTM Parameters</TabsTrigger>
              </TabsList>

              <TabsContent value="referrers">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { source: "youtube.com", visitors: 104 },
                      { source: "google.com", visitors: 76 },
                      { source: "duckduckgo.com", visitors: 11 },
                      { source: "bing.com", visitors: 2 },
                    ].map((row) => (
                      <TableRow key={row.source}>
                        <TableCell>{row.source}</TableCell>
                        <TableCell className="text-right">{row.visitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="utm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UTM</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { utm: "utm_source=twitter", visitors: 52 },
                      { utm: "utm_campaign=launch", visitors: 38 },
                      { utm: "utm_medium=email", visitors: 19 },
                    ].map((row) => (
                      <TableRow key={row.utm}>
                        <TableCell>{row.utm}</TableCell>
                        <TableCell className="text-right">{row.visitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Simple Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Countries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-gray-400">
            <p>🇺🇸 United States — 20%</p>
            <p>🇩🇪 Germany — 12%</p>
            <p>🇫🇷 France — 5%</p>
            <p>🇷🇺 Russia — 4%</p>
            <p>🇮🇳 India — 4%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-gray-400">
            <p>Desktop — 59%</p>
            <p>Mobile — 39%</p>
            <p>Tablet — 2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Operating Systems</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-gray-400">
            <p>Windows — 31%</p>
            <p>Android — 22%</p>
            <p>Mac — 20%</p>
            <p>iOS — 19%</p>
            <p>Linux — 8%</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-zinc-800 h-40 flex items-center justify-center text-gray-500">
          No custom events
        </Card>
        <Card className="bg-card border-zinc-800 h-40 flex items-center justify-center text-gray-500">
          No flags
        </Card>
      </div>
    </div>
  );
}
