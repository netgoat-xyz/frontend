import Link from "next/link";

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { NetgoatLogo } from "@/components/brand/netgoat-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <header className="flex justify-center md:justify-start">
          <NetgoatLogo priority />
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          {children}
        </main>

        <footer className="text-muted-foreground flex items-center justify-center gap-4 text-xs md:justify-start">
          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/status" className="hover:text-foreground underline-offset-4 hover:underline">
            Status
          </Link>
        </footer>
      </div>

      <AuthBrandPanel />
    </div>
  );
}
