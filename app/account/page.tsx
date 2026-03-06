"use client";

import IntegrationModal from "@/components/interface/dashboard/integrations/components/integrationModel";
import IntegrationCard from "@/components/interface/dashboard/integrations/integrationCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Loader2, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: string;
  details?: string;
}

const integrations: Integration[] = [
  {
    name: "Cloudflare",
    category: "Networking",
    description:
      "Secure and accelerate your websites with Cloudflare's global network.",
    details:
      "Use netgoat as a Reverse Proxy with Cloudflare for enhanced security and performance.",
    logo: "/integrations/cloudflare.jpeg",
  },
  {
    name: "Sentry",
    category: "Monitoring",
    description:
      "Real-time error tracking to help you optimize the performance of your code.",
    details:
      "Sentry provides real-time error monitoring and performance tracking.",
    logo: "/integrations/sentry.jpeg",
    status: "installed",
  },
  {
    name: "Grafana",
    category: "Observability",
    description: "Modern monitoring and security for cloud-scale applications.",
    details: "Create dashboards and alerts for your infrastructure.",
    logo: "/integrations/grafana.jpeg",
  },
];

const categories = ["General", "Security", "Teams", "Notifications"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("General");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPasswordUser, setIsPasswordUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const accounts = await authClient.listAccounts();
        if (!accounts?.error) {
          const hasPassword = accounts?.data?.some(
            (a) => a.providerId === "credential",
          );
          setIsPasswordUser(hasPassword || false);
        }
      } catch (e) {
        console.error("Failed to list accounts", e);
      }
    };
    checkUserType();
  }, []);

  const filteredIntegrations = integrations.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authClient.updateUser({
        name: name,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-6">
      <IntegrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integration={selectedIntegration}
      />
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-neutral-400 mt-2">
          Manage workspace, security, billing, and integrations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveSection(cat)}
                className={`relative w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                  activeSection === cat
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50"
                }`}
              >
                {activeSection === cat && (
                  <motion.div
                    layoutId="settings-pill"
                    className="absolute left-0 w-1 h-4 bg-white rounded-r-full"
                  />
                )}
                <span className="ml-2">{cat}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 mx-12">
          {activeSection === "General" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update how you appear on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer shrink-0">
                    <Avatar className="w-20! h-20! ring-2 ring-background shadow-sm">
                      <AvatarImage src={user?.image || undefined} />
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-sm font-semibold">Profile Picture</h4>
                    <p className="text-xs text-muted-foreground">
                      JPG, GIF or PNG. Max size of 2MB.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit h-8 text-xs mt-1"
                    >
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <Separator />

                <form
                  id="profile-form"
                  onSubmit={handleUpdateProfile}
                  className="space-y-4"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Display Name
                    </Label>
                    <Input
                      id="name"
                      className="max-w-md"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isPasswordUser}
                      className={`max-w-md ${!isPasswordUser ? "bg-muted/50 text-muted-foreground italic" : ""}`}
                    />
                    {!isPasswordUser && (
                      <p className="text-[11px] text-muted-foreground">
                        Managed by your SSO provider. Contact your admin to
                        change this.
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t flex justify-end">
                <Button
                  type="submit"
                  form="profile-form"
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeSection === "Apps & Integrations" && (
            <>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredIntegrations.map((item) => (
                  <IntegrationCard
                    key={item.name}
                    item={item}
                    onClick={() => {
                      setSelectedIntegration(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
