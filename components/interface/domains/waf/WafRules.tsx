"use client";

import { addDomainWAFRule, removeDomainWAFRule } from "@/actions/teamDomains";
import { List, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type WAFRule = {
  id?: string | number
  _id?: string
  name: string
  expression?: string
  action?: string
  priority?: number
  enabled?: boolean
}

export function WafRules({
  teamSlug,
  domainId,
  rules = [],
}: {
  teamSlug: string
  domainId: string
  rules?: WAFRule[]
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [action, setAction] = useState<"BLOCK" | "ALLOW" | "LOG">("BLOCK");
  const [saving, setSaving] = useState(false);
  const [removingName, setRemovingName] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setExpression("");
    setAction("BLOCK");
    setAdding(false);
  };

  const handleAdd = async () => {
    try {
      setSaving(true);
      await addDomainWAFRule(teamSlug, domainId, {
        name,
        expression,
        action,
      });
      toast.success("WAF rule saved. Agents pick this up in the next snapshot.");
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the WAF rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ruleName: string) => {
    if (!window.confirm(`Remove WAF rule “${ruleName}”?`)) {
      return;
    }

    try {
      setRemovingName(ruleName);
      await removeDomainWAFRule(teamSlug, domainId, ruleName);
      toast.success("WAF rule removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the WAF rule.");
    } finally {
      setRemovingName(null);
    }
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-800/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <List size={16} className="text-neutral-400" /> Rule Sets
        </h3>
        <button
          type="button"
          onClick={() => setAdding((open) => !open)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-medium transition-all"
        >
          <Plus size={12} /> {adding ? "Cancel" : "Add Rule"}
        </button>
      </div>

      {adding && (
        <div className="p-4 border-b border-neutral-800/50 space-y-3">
          <input
            aria-label="Rule name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="block-sql-injection"
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <textarea
            aria-label="Rule expression"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            rows={3}
            placeholder="contains(request.path, 'SELECT')"
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <div className="flex items-center justify-between gap-3">
            <select
              aria-label="Rule action"
              value={action}
              onChange={(event) => setAction(event.target.value as "BLOCK" | "ALLOW" | "LOG")}
              className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-600"
            >
              <option value="BLOCK">BLOCK</option>
              <option value="ALLOW">ALLOW</option>
              <option value="LOG">LOG</option>
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="px-3 py-1.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-60 rounded-lg text-xs font-medium transition-all"
            >
              {saving ? "Saving…" : "Save rule"}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {rules.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-neutral-500">
            No domain WAF rules yet. Saved rules land in Mongo `waf_rules` and are streamed as agent `WAFRules`.
          </p>
        ) : (
          rules.map((rule, idx) => (
            <div
              key={rule._id || rule.id || `${rule.name}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-800/50 hover:border-neutral-700/50 hover:bg-neutral-800/40 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full ${rule.enabled === false ? "bg-neutral-500" : "bg-emerald-400"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-200">{rule.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">
                      {rule.action || "BLOCK"}
                    </span>
                    <span className="ml-2 font-mono">{rule.expression || "No expression"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                  rule.enabled === false
                    ? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {rule.enabled === false ? "paused" : "active"}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(rule.name)}
                  disabled={removingName === rule.name}
                  className="p-1 text-neutral-500 hover:text-red-300 hover:bg-neutral-700 rounded transition-all"
                  aria-label={`Remove ${rule.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
