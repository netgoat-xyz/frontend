import type { Metadata } from "next";
import Header from "@/components/interface/homescreen/header";
import Footer from "@/components/interface/homescreen/footer";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import DeveloperPortal from "@/components/interface/developers/DeveloperPortal";

export const metadata: Metadata = {
  title: "Developer platform | NetGoat",
  description: "Explore, publish, review, and manage trusted NetGoat edge plugin descriptors.",
};

export default function DevelopersPage() {
  return (
    <ShaderBackground>
      <div className="min-h-svh bg-transparent">
        <Header />
        <main className="container mx-auto max-w-7xl px-4 pb-24 pt-14 md:px-6 md:pt-20">
          <DeveloperPortal />
        </main>
        <Footer />
      </div>
    </ShaderBackground>
  );
}
