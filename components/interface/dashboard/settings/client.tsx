"use client"

import { motion } from "framer-motion";
import { useState } from "react";
import IntegrationCard from "../integrations/integrationCard";
import IntegrationModal from "../integrations/components/integrationModel";
import { useTranslations } from "next-intl";


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
  const t = useTranslations("DashboardPages.settings");
  const [activeSection, setActiveSection] = useState("General");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
const [name, setName] = useState("Netgoat");

  const getSectionLabel = (section: string) => {
    if (section === "General") return t("sections.general");
    if (section === "Billing") return t("sections.billing");
    if (section === "Invoices") return t("sections.invoices");
    if (section === "Members") return t("sections.members");
    if (section === "Access Groups") return t("sections.accessGroups");
    if (section === "Webhooks") return t("sections.webhooks");
    if (section === "Security & Privacy") return t("sections.securityPrivacy");
    if (section === "Apps & Integrations") return t("sections.appsIntegrations");
    return section;
  };

  const filteredIntegrations = integrations.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-6">
      
      <IntegrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integration={selectedIntegration}
      />
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {t("title")}
        </h1>
        <p className="text-neutral-400 mt-2">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveSection(cat)}
                className={`relative w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                  activeSection === cat
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
                <span className="ml-2">{getSectionLabel(cat)}</span>
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
              {t("general.teamNameTitle")}
            </h4>
            
            <p className="text-[14px] leading-6 text-neutral-400 mt-2 mb-4">
              {t("general.teamNameDescription")}
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
              {t("general.teamNameHint")}
            </div>
            
            <button
              type="submit"
              className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
            >
              {t("actions.save")}
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
                  placeholder={t("searchIntegrationsPlaceholder")}
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
    </div>
  );
}
