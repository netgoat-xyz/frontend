"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";

import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";

/**
 * Global client providers: theme (class-based dark mode), motion defaults
 * (respects prefers-reduced-motion) and the coss toast surfaces.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
