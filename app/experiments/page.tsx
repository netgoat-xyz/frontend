"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const experiments = [
  { name: "Theme Generator", path: "/testing-grounds/theme-generator", desc: "AI-powered theme builder for rapid prototyping" },
  { name: "Component Sandbox", path: "/testing-grounds/component-sandbox", desc: "Test and iterate on UI components instantly" },
  { name: "Dynamic Form Test", path: "/testing-grounds/dynamic-form", desc: "Schema-driven form renderer for experiments" },
];

export default function TestingGrounds() {
  const [search, setSearch] = useState("");

  const filtered = experiments.filter((exp) =>
    exp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-900 text-neutral-100 p-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col items-center space-y-3 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent"
          >
            Experimental Lab
          </motion.h1>
          <p className="text-neutral-500 text-sm max-w-lg">
            A collection of experimental tools, prototypes, and playgrounds.
            Nothing stable. Everything fun.
          </p>
          <input
            placeholder="Search experiments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-4 w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
          />
        </header>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((exp, i) => (
            <motion.div
              key={exp.path}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-sm hover:border-neutral-700 hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-white">
                    {exp.name}
                  </h2>
                  <p className="text-sm text-neutral-500">{exp.desc}</p>
                </div>
                <div className="mt-4">
                  <Link
                    href={exp.path}
                    className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white"
                  >
                    Launch →
                  </Link>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/0 via-blue-500/0 to-fuchsia-500/0 opacity-0 group-hover:opacity-10 transition-opacity"
                whileHover={{
                  background:
                    "linear-gradient(90deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1))",
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-neutral-600 text-sm">
            No experiments found. Maybe invent one?
          </p>
        )}
      </div>
    </div>
  );
}
