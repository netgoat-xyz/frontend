import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["demo.netgoat.xyz", "127.0.0.1"],
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tapback.co",
        port: "",
        pathname: "/api/avatar/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
