import { getTranslations } from "next-intl/server";
import { Boxes, Code2, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Developer Overview | NetGoat",
};

export default async function DeveloperOverview() {
  const t = await getTranslations();

  const quickLinks = [
    {
      title: "Browse Catalog",
      description: "Explore available plugin extensions for the NetGoat edge",
      href: "/developers/catalog",
      icon: Boxes,
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      title: "Create a Plugin",
      description: "Build and publish your own trusted middleware descriptors",
      href: "/developers/plugins",
      icon: Code2,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Team Installs",
      description: "Manage which plugins are enabled for your teams",
      href: "/developers/installations",
      icon: PackageCheck,
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Publisher Profile",
      description: "Set up your publisher identity and request verification",
      href: "/developers/publisher",
      icon: ShieldCheck,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Developer platform
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Developer Overview</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
          Publish reviewable descriptors for middleware compiled into your NetGoat agents. 
          Teams can inspect publisher verification, credibility signals, and immutable release identities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-neutral-900 border border-neutral-800 rounded-xl p-5 card-hover transition-all duration-150 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${link.color}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Create a publisher profile", desc: "Set up your public identity with name, slug, and support links." },
            { step: "2", title: "Request verification", desc: "Submit your profile for admin review to build trust with teams." },
            { step: "3", title: "Create a plugin draft", desc: "Describe your extension, its category, and what it does." },
            { step: "4", title: "Submit an immutable release", desc: "Attach a descriptor SHA-256 and factory ID, then submit for review." },
            { step: "5", title: "Install on your team", desc: "Once approved, enable the plugin for your team through the catalog." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-semibold text-neutral-400 shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
