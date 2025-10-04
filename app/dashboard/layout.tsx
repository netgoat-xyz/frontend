"use client";
import "../globals.css";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SpeedInsights />
      <Analytics />
      {children}
      <Toaster />
    </div>
  );
}
