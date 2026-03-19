import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

let commitHash = "unknown";
try {
  commitHash = require("child_process")
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim();
} catch {}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
  pageExtensions: ["ts", "tsx"],
  devIndicators: false,
  allowedDevOrigins: ["demo.netgoat.xyz", "127.0.0.1", "192.168.50.35"],
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    scrollRestoration: true,
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tapback.co", pathname: "/api/avatar/**" },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/icons/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gitlab.com",
        pathname: "/uploads/-/system/user/avatar/**",
      },
      { protocol: "https", hostname: "gitlab.com", pathname: "/avatar/**" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
};

export default withAnalyzer(withMDX(withNextIntl(nextConfig)));
