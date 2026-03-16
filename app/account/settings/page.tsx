"use client";

import IntegrationModal from "@/components/interface/dashboard/integrations/components/integrationModel";
import IntegrationCard from "@/components/interface/dashboard/integrations/integrationCard";
import { motion } from "framer-motion";
import { useState } from "react";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: string;
  details?: string;
}

const integrations: Integration[] = [
  {
    name: "Cloudflare",
    category: "Networking",
    description:
      "Secure and accelerate your websites with Cloudflare's global network.",
    details:
      "Use netgoat as a Reverse Proxy with Cloudflare for enhanced security and performance.",
    logo: "/integrations/cloudflare.jpeg",
  },
  {
    name: "Sentry",
    category: "Monitoring",
    description:
      "Real-time error tracking to help you optimize the performance of your code.",
    details:
      "Sentry provides real-time error monitoring and performance tracking.",
    logo: "/integrations/sentry.jpeg",
    status: "installed",
  },
  {
    name: "Grafana",
    category: "Observability",
    description: "Modern monitoring and security for cloud-scale applications.",
    details: "Create dashboards and alerts for your infrastructure.",
    logo: "/integrations/grafana.jpeg",
  },
];

const categories = [
  "General",
  "Billing",
  "Invoices",
  "Members",
  "Access Groups",
  "Webhooks",
  "Security & Privacy",
  "Apps & Integrations",
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("General");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("Netgoat");

  const filteredIntegrations = integrations.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-svh bg-neutral-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-neutral-400 mt-2">
          Manage workspace, security, billing, and integrations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveSection(cat)}
                className={`relative w-full text-left px-3 py-2 rounded-md text-sm transition-all ${activeSection === cat
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50"
                  }`}
              >
                {activeSection === cat && (
                  <motion.div
                    layoutId="settings-pill"
                    className="absolute left-0 w-1 h-4 bg-white rounded-r-full"
                  />
                )}
                <span className="ml-2">{cat}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 mx-12">
          {activeSection === "General" && (
            <div className="mx-auto p-6">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden transition-all hover:border-neutral-700">
                  {/* Main Content Area */}
                  <div className="p-6">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      Team Name
                    </h4>

                    <p className="text-[14px] leading-6 text-neutral-400 mt-2 mb-4">
                      This is your team's visible name within Netgoat. For example, the name of your company or department.
                    </p>

                    <div className="relative max-w-sm">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={32}
                        spellCheck="false"
                        autoComplete="off"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Footer Area */}
                  <footer className="bg-neutral-800/70 border-t border-neutral-700/65 px-6 py-3 flex items-center justify-between">
                    <div className="text-[13px] text-neutral-500">
                      Please use 32 characters at maximum.
                    </div>

                    <button
                      type="submit"
                      className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                    >
                      Save
                    </button>
                  </footer>
                </div>
              </form>
            </div>
          )}

          {activeSection === "Apps & Integrations" && (
            <>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredIntegrations.map((item) => (
                  <IntegrationCard
                    key={item.name}
                    item={item}
                    onClick={() => {
                      setSelectedIntegration(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <IntegrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integration={selectedIntegration}
      />
      </div>
    </div>
  );
}
