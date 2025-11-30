import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitals } from "./_components/web-vitals";
import { GoogleAnalytics } from "@next/third-parties/google";
import {NextIntlClientProvider} from 'next-intl';
import Script from "next/script";

export const metadata = {
  title: "Netgoat.xyz - Main Page",
  description: "Welcome to Cloudable",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <GoogleAnalytics gaId="G-TRN0WEMY9X" />

      <SpeedInsights />
      <Analytics />
      <WebVitals />
      <body className="dark transition-all duration-300 antialiased">
        <NextIntlClientProvider> 
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
