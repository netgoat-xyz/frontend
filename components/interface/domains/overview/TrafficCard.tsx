import { Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardBarGraph from "@/components/elements/DashboardBarGraph";

interface TrafficCardProps {
  stats?: {
    total_requests: number;
    total_blocked: number;
    bandwidth_used: number;
  };
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function TrafficCard({ stats }: TrafficCardProps) {
  // Safe defaults if stats are missing
  const totalRequests = stats?.total_requests || 0;
  const totalBlocked = stats?.total_blocked || 0;
  const bandwidthStr = stats?.bandwidth_used ? formatBytes(stats.bandwidth_used) : "0 B";

  // Dummy logic for formatted short numbers
  const formatCompact = (num: number) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity size={18} className="text-neutral-500" /> Traffic (24h)
        </h3>
        <Select>
          <SelectTrigger className="">
            <SelectValue placeholder="Select a time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Time Range</SelectLabel>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Fake Chart Visualization */}
      <div className="h-48 w-full flex items-end gap-1">
        <DashboardBarGraph data={[35, 45, 30, 60, 75, 50]} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="text-xs text-neutral-500">Total Requests</div>
          <div className="text-xl font-bold font-mono">{formatCompact(totalRequests)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Bandwidth Used</div>
          <div className="text-xl font-bold font-mono">{bandwidthStr}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Total Blocked</div>
          <div className="text-xl font-bold font-mono text-red-500">{formatCompact(totalBlocked)}</div>
        </div>
      </div>
    </div>
  );
}
