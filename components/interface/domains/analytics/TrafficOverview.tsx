import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statCards = [
  { label: "Total Requests", value: "2.84M", change: "+12.3%", trend: "up" },
  { label: "Bandwidth", value: "18.7 GB", change: "+8.1%", trend: "up" },
  { label: "Unique Visitors", value: "34.2K", change: "-2.4%", trend: "down" },
  { label: "Avg Response Time", value: "142ms", change: "0%", trend: "flat" },
] as const;

export function TrafficOverview() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Traffic Overview
          </h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Real-time delivery performance and usage.
          </p>
        </div>

        <Select defaultValue="24h">
          <SelectTrigger className="w-[160px] bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-9 text-xs">
            <Calendar size={14} className="mr-2 text-neutral-400" />
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={`p-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-emerald-500/10"
                    : stat.trend === "down"
                      ? "bg-red-500/10"
                      : "bg-neutral-500/10"
                }`}
              >
                {stat.trend === "up" && (
                  <ArrowUpRight size={12} className="text-emerald-600" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownRight size={12} className="text-red-500" />
                )}
                {stat.trend === "flat" && (
                  <Minus size={12} className="text-neutral-500" />
                )}
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {stat.value}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  stat.trend === "up"
                    ? "text-emerald-600"
                    : stat.trend === "down"
                      ? "text-red-500"
                      : "text-neutral-400"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>    </div>
  );
}
