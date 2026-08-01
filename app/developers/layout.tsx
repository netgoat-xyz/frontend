import type { Metadata } from "next";
import NavigationTop from "@/components/elements/NavigationTop";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";

export const metadata: Metadata = {
  title: "Developer platform | NetGoat",
  description: "Explore, publish, review, and manage trusted NetGoat edge plugin descriptors.",
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-neutral-950 flex flex-col">
      <NavigationTop />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <BelowScreenFooter />
    </div>
  );
}
