import path from "node:path";
import type { NextConfig } from "next";

// frontend-v2 lives inside the NetGoat monorepo (bun workspaces) whose
// node_modules is hoisted to the repository root — two directories up.
// The workspace root is outside this app's git repository, so Next.js
// cannot infer it automatically; point Turbopack at it explicitly.
const workspaceRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
