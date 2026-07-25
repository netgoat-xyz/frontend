import type { Metadata } from "next";
import PluginReviewConsole from "@/components/interface/admin/PluginReviewConsole";

export const metadata: Metadata = {
  title: "Plugin review | NetGoat Admin",
  description: "Review publisher verification, immutable plugin releases, and trusted agent deployments.",
};

export default function AdminPluginsPage() {
  return <PluginReviewConsole />;
}
