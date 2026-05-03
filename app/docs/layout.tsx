import type React from "react";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Header from "@/components/interface/homescreen/header";

const DocsSidebar = dynamic(() => import("./sidebar"), {
  loading: () => (
    <aside className="hidden sticky h-auto w-full shrink-0 md:block" aria-hidden="true">
      <div className="sticky top-10 space-y-3 rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-md">
        <div className="h-3 w-24 rounded bg-muted/50" />
        <div className="h-8 w-full rounded-lg bg-muted/40" />
        <div className="h-8 w-full rounded-lg bg-muted/40" />
        <div className="h-8 w-5/6 rounded-lg bg-muted/40" />
      </div>
    </aside>
  ),
});

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Docs");

  return (
    <ShaderBackground>
      <div className="relative min-h-screen flex-col text-foreground flex overflow-hidden">
        
        {/* Floating Header */}
        <div className="relative z-50 w-full bg-transparent">
          <Header />
        </div>

        {/* Hero-like Title for docs */}
        <div className="pt-16 pb-10 text-center relative z-10 px-6">
           <div className="flex justify-center mb-6">
             <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-foreground/5 backdrop-blur-sm border border-border/60 relative shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
               <div className="absolute top-0 left-2 right-2 h-px bg-linear-to-r from-transparent via-border/60 to-transparent rounded-full" />
               <span className="text-foreground/80 text-[11px] font-light tracking-widest uppercase">{t("hero.badge")}</span>
             </div>
           </div>
           <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-bold text-foreground mb-4">
               {t("hero.title")}
           </h1>
           <p className="text-sm md:text-base font-light text-muted-foreground max-w-lg mx-auto">
               {t("hero.description")}
           </p>
        </div>

        <div className="container mx-auto max-w-6xl flex-1 items-start px-6 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-14 pb-24 relative z-10">
          <DocsSidebar />

          <main className="relative min-w-0 w-full">
            <div className="mb-8 flex items-center justify-center gap-2 rounded-full border border-border/60 bg-foreground/5 px-4 py-2 text-[11px] font-light uppercase tracking-widest text-muted-foreground backdrop-blur-xl md:hidden">
              {t("mobileNav")}
            </div>
            <div className="w-full relative">
              <article className="docs-prose prose dark:prose-invert max-w-none rounded-3xl border border-border/60 bg-card/50 p-8 md:p-12 backdrop-blur-md transition-colors duration-500 hover:border-border">
                {children}
              </article>
            </div>
          </main>
        </div>
      </div>
    </ShaderBackground>
  );
}