import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import NavigationTop from "@/components/elements/NavigationTop";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import 'cal-sans';
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={cn("dark", inter.variable)} suppressHydrationWarning>
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
