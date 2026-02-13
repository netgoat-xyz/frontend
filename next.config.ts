import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

let commitHash = 'unknown';
try {
  commitHash = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Could not get commit hash', e);
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
  devIndicators: false,
  allowedDevOrigins: ["demo.netgoat.xyz", "127.0.0.1"],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tapback.co",
        pathname: "/api/avatar/**",
      },
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
      {
        protocol: "https",
        hostname: "gitlab.com",
        pathname: "/avatar/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
