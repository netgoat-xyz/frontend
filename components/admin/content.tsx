"use client";

import dynamic from "next/dynamic";
import { useState, memo } from "react";
import { OverviewContent } from "@/components/admin/content/overview";
import { Spinner } from "../ui/spinner";

interface AdminContentProps {
  activeTab: string;
  activeSection: string;
  onTabChange: (tab: string) => void;
}

// Dynamic lazy imports
const BlogHome = dynamic(() => import("./content/blog"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Blogs..." />,
});
const BlogCreate = dynamic(() => import("./content/blog_create"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Blog Creator..." />,
});
const BlogEdit = dynamic(() => import("./content/blog_edit"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Blog Editor..." />,
});
const SettingsGeneral = dynamic(() => import("./content/settings/general"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading General Settings..." />,
});
const SettingsAI = dynamic(() => import("./content/settings/ai"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading AI Settings..." />,
});
const SettingsSystemStatus = dynamic(
  () => import("./content/settings/system-status"),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder title="Loading System Status..." />,
  }
);
const SettingsIntergrations = dynamic(
  () => import("./content/settings/Intergrations"),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder title="Loading Intergrations..." />,
  }
);
const SettingsDataCache = dynamic(
  () => import("./content/settings/data-cache"),
  {
    ssr: false,
    loading: () => (
      <LoadingPlaceholder title="Loading Data Cache Settings..." />
    ),
  }
);
const SettingsCronjobs = dynamic(() => import("./content/settings/cronjobs"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Cronjob Settings..." />,
});
const SettingsWebhooks = dynamic(() => import("./content/settings/webhooks"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Webhook Settings..." />,
});
const SettingsSecurity = dynamic(() => import("./content/settings/security"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Security Settings..." />,
});
const SettingsAdvanced = dynamic(() => import("./content/settings/advanced"), {
  ssr: false,
  loading: () => <LoadingPlaceholder title="Loading Advanced Settings..." />,
});
// Small animated loader
function LoadingPlaceholder({ title }: { title: string }) {
  return (
<div className="flex flex-col items-center justify-center py-20 text-center animate-pulse space-y-3">
  <div className="flex items-center gap-2">
    <Spinner className="h-4 w-4" />
    <h2 className="text-lg font-semibold text-muted-foreground">{title}</h2>
  </div>
  <p className="text-sm text-muted-foreground">Please wait a moment...</p>
</div>

  );
}

export const AdminContent = memo(function AdminContent({
  activeTab,
  activeSection,
  onTabChange,
}: AdminContentProps) {
  const [editSlug, setEditSlug] = useState<string | null>(null);

  const handleEdit = (slug: string) => {
    setEditSlug(slug);
    onTabChange("blog_edit");
  };

  // Define top-level tab components
  const tabRegistry: Record<string, React.ReactNode> = {
    overview: <OverviewContent />,
    blog: (
      <BlogHome
        onCreate={() => onTabChange("blog_create")}
        onEdit={handleEdit}
      />
    ),
    blog_create: <BlogCreate />,
    blog_edit: editSlug ? <BlogEdit slug={editSlug} /> : null,
  };

  // Define sectioned components (nested areas)
  const sectionRegistry: Record<string, React.ReactNode> = {
    "settings:general": <SettingsGeneral />,
    "settings:ai": <SettingsAI />,
    "settings:system": <SettingsSystemStatus />,
    // "settings:git": <SettingsGit />,
    "settings:integrations": <SettingsIntergrations />,
    "settings:data-cache": <SettingsDataCache />,
    "settings:cron-jobs": <SettingsCronjobs />,
    "settings:webhooks": <SettingsWebhooks />,
    // "settings:log-drains": <SettingsLogDrains />,
    "settings:security": <SettingsSecurity />,
    // "settings:secure-compute": <SettingsSecureCompute />,
    "settings:advanced": <SettingsAdvanced />,
  };

  const sectionKey = `${activeTab}:${activeSection}`;
  const ActiveComponent = sectionRegistry[sectionKey] ?? tabRegistry[activeTab];

  if (!ActiveComponent) {
    return (
      <div className="p-6 text-center py-16">
        <h2 className="text-xl font-semibold mb-2 capitalize">
          {activeTab} {activeSection && `- ${activeSection}`}
        </h2>
        <p className="text-muted-foreground">
          Content for this section will appear here soon.
        </p>
      </div>
    );
  }

  return <>{ActiveComponent}</>;
});
