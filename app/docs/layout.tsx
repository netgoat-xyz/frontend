import type React from "react";
import Link from "next/link";

import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Header from "@/components/interface/homescreen/header";
import DocsSidebar from "./sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShaderBackground>
      <div className="relative min-h-screen flex-col text-neutral-100 flex overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]" />
        
        {/* Floating Header */}
        <div className="relative z-50 w-full bg-transparent">
          <Header />
        </div>

        {/* Hero-like Title for docs */}
        <div className="pt-16 pb-10 text-center relative z-10 px-6">
           <div className="flex justify-center mb-6">
             <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 relative shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
               <div className="absolute top-0 left-2 right-2 h-px bg-linear-to-r from-transparent via-white/20 to-transparent rounded-full" />
               <span className="text-white/80 text-[11px] font-light tracking-widest uppercase">Documentation</span>
             </div>
           </div>
           <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-light text-white mb-4">
               Netgoat Docs
           </h1>
           <p className="text-sm md:text-base font-light text-white/50 max-w-lg mx-auto">
               Everything you need to build, deploy, and scale your network infrastructure.
           </p>
        </div>

        <div className="container mx-auto max-w-6xl flex-1 items-start px-6 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-14 pb-24 relative z-10">
          <DocsSidebar />

          <main className="relative min-w-0 w-full">
            <div className="mb-8 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-light uppercase tracking-widest text-white/60 backdrop-blur-xl md:hidden">
              Navigation Menu
            </div>
            <div className="w-full relative">
              <article className="docs-prose prose prose-invert max-w-none rounded-3xl border border-white/6 bg-white/1.5 p-8 md:p-12 backdrop-blur-md shadow-2xl shadow-black/50 transition-colors duration-500 hover:border-white/12">
                {children}
              </article>
            </div>
          </main>
        </div>
      </div>
    </ShaderBackground>
  );
}