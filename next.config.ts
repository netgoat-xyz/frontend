import path from "node:path";
import type { NextConfig } from "next";

// frontend-v2 can run either inside the NetGoat monorepo (bun workspaces, with
// node_modules hoisted to the repository root) or as a standalone checkout of
// netgoat-xyz/frontend. Next.js cannot infer a workspace root outside the app
// directory, so it is only overridden when explicitly requested.
const workspaceRoot = process.env.NEXT_TURBOPACK_ROOT
  ? path.resolve(process.env.NEXT_TURBOPACK_ROOT)
  : process.cwd();

const nextConfig: NextConfig = {
  // Emits .next/standalone for the container image in ./Dockerfile.
  output: "standalone",
  // WAFL ships TypeScript source from the local file dependency.
  transpilePackages: ["@netgoat/wafl"],
  turbopack: {
    root: workspaceRoot,
  },
  experimental: {
    // Enables forbidden()/unauthorized() route interrupts for auth gates.
    authInterrupts: true,
  },
};

export default nextConfig;
