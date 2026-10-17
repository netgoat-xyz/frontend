import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { AppProviders } from "@/app/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NetGoat — Reverse proxy, DNS, SSL and WAF in one panel",
    template: "%s | NetGoat",
  },
  description:
    "Blazing-fast, self-hostable reverse proxy and traffic manager with Cloudflare-like features: DNS, SSL, WAF, analytics and more.",
  applicationName: "NetGoat",
  openGraph: {
    type: "website",
    siteName: "NetGoat",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/twitter_og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          interHeading.variable,
          geistMono.variable,
          "bg-background text-foreground font-sans antialiased",
        )}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
