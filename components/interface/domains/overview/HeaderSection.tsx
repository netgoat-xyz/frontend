import { ExternalLink, PauseCircle, Terminal } from "lucide-react";

interface HeaderSectionProps {
  domainData: {
    name: string;
    status: string;
    origin: string;
    certExp: string;
    wafStatus: string;
  };
}

export function HeaderSection({ domainData }: HeaderSectionProps) {
  return (
    <div className="mx-auto mb-8">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{domainData.name}</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
          <a
            href={`https://${domainData.name}`}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-md text-sm font-medium transition-colors">
            <PauseCircle size={16} /> Pause Service
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 rounded-md text-sm font-medium transition-colors">
            <Terminal size={16} /> Live Logs
          </button>
        </div>
      </div>
    </div>
  );
}
