"use client";

import { motion } from "motion/react";
import { useState, useMemo, useEffect, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import IntegrationCard from "./integrationCard";
import { useTranslations } from "next-intl";

const IntegrationModal = dynamic(() => import("./components/integrationModel"));

type IntegrationCategory =
  | "cloud"
  | "networking"
  | "monitoring"
  | "security"
  | "observability";

type IntegrationFilter = "all" | IntegrationCategory;

interface Integration {
  name: string;
  categoryKey: IntegrationCategory;
  category: string;
  description: string;
  logo: string;
  status?: "installed" | "disabled";
  details?: string;
}

interface IntegrationDefinition {
  key:
    | "cloudflare"
    | "sentry"
    | "grafana"
    | "tailscale"
    | "googleCloud"
    | "amazonWebServices"
    | "ngrok";
  category: IntegrationCategory;
  logo: string;
  status?: "installed" | "disabled";
}

const CATEGORIES: IntegrationFilter[] = [
  "all",
  "cloud",
  "networking",
  "monitoring",
  "security",
  "observability",
];

const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    key: "cloudflare",
    category: "networking",
    logo: "/integrations/cloudflare.jpeg",
  },
  {
    key: "sentry",
    category: "monitoring",
    logo: "/integrations/sentry.jpeg",
    status: "installed",
  },
  {
    key: "grafana",
    category: "observability",
    logo: "/integrations/grafana.jpeg",
  },
  {
    key: "tailscale",
    category: "networking",
    logo: "/integrations/tailscale.png",
  },
  {
    key: "googleCloud",
    category: "cloud",
    logo: "/integrations/gcp.jpeg",
    status: "installed",
  },
  {
    key: "amazonWebServices",
    category: "cloud",
    logo: "/integrations/aws.jpeg",
  },
  {
    key: "ngrok",
    category: "networking",
    logo: "/integrations/ngrok.jpeg",
  }
];

const IntegrationsSidebar = memo(({ 
  selectedCategory, 
  onSelectCategory,
  t,
}: { 
  selectedCategory: IntegrationFilter;
  onSelectCategory: (category: IntegrationFilter) => void;
  t: ReturnType<typeof useTranslations>;
}) => {
  const getCategoryLabel = (category: IntegrationFilter) => t(`categories.${category}`);

  return (
    <aside className="w-full lg:w-48 shrink-0">
      <nav className="space-y-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`relative w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center group ${
              selectedCategory === cat
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50"
            }`}
          >
            {selectedCategory === cat && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-4 bg-white rounded-r-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span
              className={
                selectedCategory === cat ? "ml-2" : "ml-0 transition-all"
              }
            >
              {getCategoryLabel(cat)}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
});

IntegrationsSidebar.displayName = "IntegrationsSidebar";

const IntegrationsContent = memo(({ selectedCategory }: { selectedCategory: IntegrationFilter }) => {
  const t = useTranslations("DashboardPages.integrations");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);

  const integrations = useMemo(
    () =>
      INTEGRATION_DEFINITIONS.map((integration) => ({
        name: t(`items.${integration.key}.name`),
        categoryKey: integration.category,
        category: t(`categories.${integration.category}`),
        description: t(`items.${integration.key}.description`),
        details: t(`items.${integration.key}.details`),
        logo: integration.logo,
        status: integration.status,
      })),
    [t],
  );

  // Debounce search term to prevent excessive filtering during typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCategory =
        selectedCategory === "all" || integration.categoryKey === selectedCategory;
        
      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchTerm, integrations, selectedCategory]);

  const handleCardClick = useCallback((integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
    setHasOpened(true);
  }, []);

  return (
    <div className="flex-1">
      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 px-4 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) => (
          <IntegrationCard
            key={item.name}
            item={item}
            onClick={() => handleCardClick(item)}
          />
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <p className="text-neutral-500 text-center mt-10">
          {t("empty")}
        </p>
      )}

      {/* The Modal */}
      {hasOpened && (
        <IntegrationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            integration={selectedIntegration}
        />
      )}
    </div>
  );
});

IntegrationsContent.displayName = "IntegrationsContent";

export default function IntegrationsPage() {
  const t = useTranslations("DashboardPages.integrations");
  const [selectedCategory, setSelectedCategory] = useState<IntegrationFilter>("all");

  return (
    <div className="">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {t("title")}
        </h1>
        <p className="text-neutral-400 mt-2 text-base">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <IntegrationsSidebar 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory}
          t={t}
        />
        <IntegrationsContent selectedCategory={selectedCategory} />
      </div>
    </div>
  );
}
