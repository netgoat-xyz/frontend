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
  details?: string; // Add details here as well
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
      "Sentry provides real-time error monitoring and performance tracking for all your applications. Quickly identify and resolve issues with detailed stack traces and context.",
    logo: "/integrations/sentry.jpeg",
    status: "installed",
  },
  {
    name: "Grafana",
    category: "Observability",
    description: "Modern monitoring and security for cloud-scale applications.",
    details:
      "Grafana is a monitoring and visualization tool that allows you to create dashboards and alerts for your infrastructure and applications.",
    logo: "/integrations/grafana.jpeg",
  },
  {
    name: "Tailscale",
    category: "Networking",
    description: "Tailscale is a zero-config VPN for secure networking.",
    details:
      "Use netgoat as a MITM for your tailscale devices.",
    logo: "/integrations/tailscale.png",
  },
  {
    name: "Google Cloud Platform",
    category: "Cloud",
    description:
      "The suite of cloud computing services that runs on the same infrastructure that Google uses internally.",
    details:
      "Spin up virtual machines and have them already setup to use netgoat as a proxy.",
    logo: "/integrations/gcp.jpeg",
    status: "installed",
  },
  {
    name: "Amazon Web Services",
    category: "Cloud",
    description:
      "Comprehensive and broadly adopted cloud platform offering over 200 fully featured services.",
    details:
      "Spin up virtual machines and have them already setup to use netgoat as a proxy.",
    logo: "/integrations/aws.jpeg",
  },
  {
    name: "Ngrok",
    category: "Networking",
    description:
      "Secure introspectable tunnels to localhost for easy testing and sharing.",
    details:
      "Ngrok allows you to expose a local server to the internet securely. Use netgoat to monitor and analyze traffic passing through your ngrok tunnels.",
    logo: "/integrations/ngrok.jpeg",
  }
];

export default function IntegrationsPage() {
  const categories = [
    "All",
    "Cloud",
    "Networking",
    "Monitoring",
    "Security",
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  return (
    <div className="">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Integrations
        </h1>
        <p className="text-neutral-400 mt-2 text-base">
          Extend your workflow with over 100+ tools for monitoring, databases,
          and more.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-48 shrink-0">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
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
                  {cat}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search integrations..."
              className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-colors"
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
              No integrations found.
            </p>
          )}
        </div>
      </div>

      {/* The Modal */}
      <IntegrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integration={selectedIntegration}
      />
    </div>
  );
}
