import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
      <SpeedInsights/>
      <Analytics/>
      <body className="dark transition-all duration-300 antialiased">
        {children}
      </body>
    </html>
  );
}
