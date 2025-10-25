"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/dashboard/header";
import { AdminNav } from "@/components/dashboard/nav";
import { AdminSidebar } from "@/components/dashboard/sidebar";
import { AdminContent } from "@/components/dashboard/content";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <AdminNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex">
        { activeTab === "settings" && <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} /> }

        <main className="flex-1">
          <AdminContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeSection={activeSection}
          />
        </main>
      </div>
    </div>
  );
}
