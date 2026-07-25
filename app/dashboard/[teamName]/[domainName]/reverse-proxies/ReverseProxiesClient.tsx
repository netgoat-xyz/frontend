"use client";

import { useState } from "react";
import { addReverseProxy, removeReverseProxy } from "@/actions/teamDomains";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type ReverseProxy = {
  _id: string
  name: string
  path?: string
  target_url: string
  enabled: boolean
}

export function ReverseProxiesClient({ teamSlug, domainId, reverseProxies }: { teamSlug: string; domainId: string; reverseProxies: ReverseProxy[] }) {
  const t = useTranslations("DashboardPages.reverseProxy");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("/*");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
     if (!name || !target) return toast.error(t("errors.nameAndTargetRequired"));
    setLoading(true);
    const res = await addReverseProxy(teamSlug, domainId, { name, path, target_url: target });
    if (res.success) {
       toast.success(t("toasts.added"));
       setAdding(false);
       setName("");
       setTarget("");
    } else {
       toast.error(res.error || t("errors.addFailed"));
    }
    setLoading(false);
  }

  const handleRemove = async (id: string) => {
    const res = await removeReverseProxy(teamSlug, domainId, id);
    if (res.success) toast.success(t("toasts.removed"));
    else toast.error(res.error || t("errors.removeFailed"));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-sm uppercase text-neutral-500 flex items-center gap-2">
          {t("title")}
        </h3>
        <button 
          onClick={() => setAdding(!adding)}
          className="px-4 py-2 text-sm bg-indigo-500/10 border-indigo-500/30 border rounded-md text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t("actions.addUpstream")}
        </button>
      </div>

      {adding && (
         <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">{t("fields.ruleName")}</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={t("placeholders.ruleName")} className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">{t("fields.routePath")}</label>
                  <input value={path} onChange={e => setPath(e.target.value)} placeholder={t("placeholders.routePath")} className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">{t("fields.targetUrl")}</label>
                  <input value={target} onChange={e => setTarget(e.target.value)} placeholder={t("placeholders.targetUrl")} className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                 <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">{t("actions.cancel")}</button>
                 <button onClick={handleAdd} disabled={loading} className="px-4 py-2 text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md disabled:opacity-50">{t("actions.saveRule")}</button>
            </div>
         </div>
      )}
      
      {reverseProxies && reverseProxies.length > 0 ? (
        <div className="space-y-4">
          {reverseProxies.map((proxy) => (
             <div key={proxy._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-neutral-100 dark:border-neutral-800 rounded-lg group hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors">
              <div>
                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                   {proxy.name}
                   <div className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${proxy.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-500'}`}>
                    {proxy.enabled ? t("status.active") : t("status.disabled")}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-2 flex items-center gap-2">
                  <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">{proxy.path || "/*"}</span> 
                  <ArrowRight className="w-3 h-3 text-neutral-400" /> 
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">{proxy.target_url}</span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRemove(proxy._id)} className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center text-center text-neutral-500 space-y-4">
           <p className="text-sm">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
