"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Loader2, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPluginPublisher,
  listMyPluginPublishers,
  requestPluginPublisherVerification,
  updatePluginPublisher,
} from "@/actions/developerPlugins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toPublisherList, type CatalogPublisher } from "@/components/interface/developers/pluginTypes";
import { CredibilityScore, StatusBadge } from "@/components/interface/developers/pluginUi";

type ServerAction = (...args: unknown[]) => Promise<unknown>;
function invoke(action: unknown, ...args: unknown[]): Promise<unknown> {
  return (action as ServerAction)(...args);
}
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const EMPTY_FORM = { slug: "", display_name: "", description: "", website_url: "", support_url: "" };

export default function PublisherPage() {
  const [publishers, setPublishers] = useState<CatalogPublisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke(listMyPluginPublishers);
      const list = toPublisherList(result);
      setPublishers(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const startEdit = (p: CatalogPublisher) => {
    setForm({ slug: p.slug, display_name: p.displayName, description: p.description, website_url: p.websiteUrl, support_url: p.supportUrl });
    setEditingId(p.id);
  };

  const submit = async () => {
    setSaving("publisher");
    try {
      if (editingId) {
        await invoke(updatePluginPublisher, { publisher_id: editingId, ...form });
        toast.success("Publisher updated.");
      } else {
        await invoke(createPluginPublisher, form);
        toast.success("Publisher created.");
      }
      setForm(EMPTY_FORM); setEditingId(""); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not save.")); }
    finally { setSaving(null); }
  };

  const requestVerification = async (publisher: CatalogPublisher) => {
    setSaving(`verify-${publisher.id}`);
    try {
      await invoke(requestPluginPublisherVerification, { publisher_id: publisher.id });
      toast.success("Verification requested."); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not request verification.")); }
    finally { setSaving(null); }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-neutral-800" />
        <div className="h-64 rounded-xl bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Publisher Profile
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-100">
              <ShieldCheck className="h-5 w-5 text-sky-300" />
              {editingId ? "Edit publisher profile" : "Create a publisher profile"}
            </CardTitle>
            <CardDescription className="text-neutral-500">
              A public identity for your plugins. Verification is a manual admin review.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" required>
              <Input value={form.display_name} maxLength={96} placeholder="Acme Edge Tools" onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
            </Field>
            <Field label="Slug" required>
              <Input value={form.slug} maxLength={80} placeholder="acme-edge" autoCapitalize="none" onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
            </Field>
            <Field label="Website URL">
              <Input value={form.website_url} type="url" placeholder="https://example.com" onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
            </Field>
            <Field label="Support URL">
              <Input value={form.support_url} type="url" placeholder="https://support.example.com" onChange={(e) => setForm({ ...form, support_url: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea value={form.description} rows={3} placeholder="What do you build and how can teams reach you?" onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t border-neutral-800 pt-5">
            <Button type="button" onClick={submit} disabled={saving === "publisher"} className="bg-neutral-100 text-neutral-900 hover:bg-white">
              {saving === "publisher" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {editingId ? "Save changes" : "Create publisher"}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300">Your Publishers</h3>
          {publishers.length ? publishers.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {p.verificationStatus === "verified" ? (
                      <CheckCircle2 className="h-4 w-4 text-sky-300" />
                    ) : null}
                    <span className="text-sm font-medium text-neutral-200 truncate">{p.displayName || p.slug}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 font-mono">{p.slug}</p>
                </div>
                <StatusBadge status={p.verificationStatus} />
              </div>
              <CredibilityScore publisher={p} />
              {p.description ? (
                <p className="mt-2 text-xs text-neutral-500 line-clamp-2">{p.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-neutral-400 hover:text-neutral-200" onClick={() => startEdit(p)}>Edit</Button>
                {p.websiteUrl ? (
                  <a href={p.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 h-7 px-2 text-xs text-neutral-500 hover:text-neutral-300">
                    Website <ExternalLink size={10} />
                  </a>
                ) : null}
                {p.verificationStatus !== "verified" && p.verificationStatus !== "pending" ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-sky-200 hover:text-sky-100" disabled={saving === `verify-${p.id}`} onClick={() => requestVerification(p)}>
                    {saving === `verify-${p.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Request verification
                  </Button>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-neutral-600" />
              <p className="mt-2 text-sm text-neutral-500">No publishers yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label className="text-neutral-300">{label}{required ? <span className="ml-1 text-red-400">*</span> : null}</Label>{children}</div>;
}
