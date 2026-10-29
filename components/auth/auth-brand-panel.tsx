"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { fadeUp, stagger } from "@/lib/motion";

const HIGHLIGHTS = [
  {
    title: "Edge-native reverse proxy",
    body: "Route, rewrite and cache traffic with per-domain rules that deploy instantly.",
  },
  {
    title: "DNS, SSL and WAF",
    body: "Records, certificates and firewall rules managed from one control plane.",
  },
  {
    title: "Real-time analytics",
    body: "Requests, bandwidth and threats streamed straight from your edge agents.",
  },
];

/**
 * Right-hand brand panel on the auth pages: solid ground, the mascot mark and
 * a short promise list that staggers in.
 */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.05),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <motion.div
        variants={stagger(0.08, 0.1)}
        initial="hidden"
        animate="visible"
        className="relative flex flex-1 flex-col justify-center gap-12 px-14"
      >
        <motion.p
          variants={fadeUp}
          className="font-heading max-w-md text-3xl leading-snug font-medium text-balance text-white"
        >
          The traffic layer for people who&apos;d rather ship than babysit
          infrastructure.
        </motion.p>

        <div className="flex max-w-md flex-col gap-6">
          {HIGHLIGHTS.map((item) => (
            <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400"
              />
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative px-14 pb-10 text-xs text-zinc-500"
      >
        Self-hostable · Open control plane · Built for edge agents
      </motion.p>
    </div>
  );
}
