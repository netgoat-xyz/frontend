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

export function TrafficCard() {
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
          <div className="text-xl font-bold font-mono">1.24M</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Cached Data</div>
          <div className="text-xl font-bold font-mono">4.5GB</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Unique Visitors</div>
          <div className="text-xl font-bold font-mono">12.4k</div>
        </div>
      </div>
    </div>
  );
}
