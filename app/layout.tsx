import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import NavigationTop from "@/components/elements/NavigationTop";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "cal-sans";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = {
  title: "NetGoat",
  description: "A secure, scalable, and easy-to-use networking solution.",
  keywords: ["network", "security", "learning", "NetGoat"],
  authors: [{ name: "NetGoat Team", url: "https://netgoat.xyz" }],
  openGraph: {
    title: "NetGoat",
    description: "A secure, scalable, and easy-to-use networking solution.",
    url: "https://netgoat.xyz",
    siteName: "NetGoat",
    images: [
      {
        url: "https://dry-spoons-battle.loca.lt/og.png",
        width: 1200,
        height: 630,
        alt: "NetGoat Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NetGoat",
    description: "A secure, scalable, and easy-to-use networking solution.",
    images: ["https://dry-spoons-battle.loca.lt/og.png"],
    creator: "@duckeydev",
  },
  icons: {
    icon: "/favicon.ico",
  },
};
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
        className={`${inter.className} bg-neutral-950 text-white antialiased transform-gpu transition-all duration-200 `}
      >
        <NextIntlClientProvider messages={messages}>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
