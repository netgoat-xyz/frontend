import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import NavigationTop from "@/components/elements/NavigationTop";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "cal-sans";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { getPublicSettings } from "@/actions/adminValues";
import GlobalBanner from "@/components/elements/GlobalBanner";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = settings.siteName || "NetGoat";

  return {
    title: siteName,
    description: "A secure, scalable, and easy-to-use networking solution.",
    keywords: ["network", "security", "learning", siteName],
    authors: [{ name: `${siteName} Team`, url: "https://netgoat.xyz" }],
    openGraph: {
      title: siteName,
      description: "A secure, scalable, and easy-to-use networking solution.",
      url: "https://netgoat.xyz",
      siteName: siteName,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${siteName} Logo`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: "A secure, scalable, and easy-to-use networking solution.",
      images: ["/og.png"],
      creator: "@duckeydev",
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn("dark", inter.variable)}
      suppressHydrationWarning
    >
      <Analytics />
      <body
        className={`${inter.className} bg-neutral-950 text-white antialiased transition-all duration-200 `}
      >
        <NextIntlClientProvider messages={messages}>
          <GlobalBanner />
          <main>{children}</main>
          <BelowScreenFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
