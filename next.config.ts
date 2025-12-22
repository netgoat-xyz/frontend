import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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

export default nextConfig;
