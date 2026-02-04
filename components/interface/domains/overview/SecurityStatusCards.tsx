import { Shield, Lock } from "lucide-react";

export function SecurityStatusCards() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-indigo-400/50 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 group-hover:text-indigo-400 transition-colors">
            <Shield size={20} />
          </div>
          <div className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
            ENABLED
          </div>
        </div>
        <h4 className="font-semibold text-sm">WAF Mode</h4>
        <p className="text-xs text-neutral-500 mt-1">
          Hawk detection active. Blocking standard OWASP threats.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-indigo-400/50 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 group-hover:text-indigo-400 transition-colors">
            <Lock size={20} />
          </div>
          <div className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
            AUTO
          </div>
        </div>
        <h4 className="font-semibold text-sm">SSL/TLS</h4>
        <p className="text-xs text-neutral-500 mt-1">
          Let's Encrypt certificate active. Auto-renews in 89 days.
        </p>
      </div>
    </div>
  );
}
