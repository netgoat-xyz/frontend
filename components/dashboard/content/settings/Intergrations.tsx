"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "../../../SiteTitle";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface OAuthConfig {
  name: string;
  redirectUri: string;
  state: boolean;
  setState: (val: boolean) => void;
  clientId: string;
  setClientId: (val: string) => void;
  clientSecret: string;
  setClientSecret: (val: string) => void;
}

export default function SettingsIntegrations() {
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubClientId, setGithubClientId] = useState("");
  const [githubClientSecret, setGithubClientSecret] = useState("");

  const [discordEnabled, setDiscordEnabled] = useState(true);
  const [discordClientId, setDiscordClientId] = useState("");
  const [discordClientSecret, setDiscordClientSecret] = useState("");

  const [appleEnabled, setAppleEnabled] = useState(false);
  const [appleClientId, setAppleClientId] = useState("");
  const [appleClientSecret, setAppleClientSecret] = useState("");

  const providers: OAuthConfig[] = [
    {
      name: "Google OAuth",
      redirectUri: "/api/callback/google",
      state: googleEnabled,
      setState: setGoogleEnabled,
      clientId: googleClientId,
      setClientId: setGoogleClientId,
      clientSecret: googleClientSecret,
      setClientSecret: setGoogleClientSecret,
    },
    {
      name: "GitHub OAuth",
      redirectUri: "/api/callback/github",
      state: githubEnabled,
      setState: setGithubEnabled,
      clientId: githubClientId,
      setClientId: setGithubClientId,
      clientSecret: githubClientSecret,
      setClientSecret: setGithubClientSecret,
    },
    {
      name: "Discord OAuth",
      redirectUri: "/api/callback/discord",
      state: discordEnabled,
      setState: setDiscordEnabled,
      clientId: discordClientId,
      setClientId: setDiscordClientId,
      clientSecret: discordClientSecret,
      setClientSecret: setDiscordClientSecret,
    },
    {
      name: "Apple OAuth",
      redirectUri: "/api/callback/apple",
      state: appleEnabled,
      setState: setAppleEnabled,
      clientId: appleClientId,
      setClientId: setAppleClientId,
      clientSecret: appleClientSecret,
      setClientSecret: setAppleClientSecret,
    },
  ];

  const handleSave = () => toast.success("Integrations updated 🎉");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <PageTitle
        title="Integrations"
        subtitle="Enable/Disable login OAuth methods and configure credentials."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.name} className="transition-all duration-300 ease-in-out">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{provider.name}</h2>
              <Switch
                checked={provider.state}
                onCheckedChange={provider.setState}
              />
            </CardHeader>

            {/* Expandable Content */}
            <CardContent
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                provider.state ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4">
                <div>
                  <Label>Client ID</Label>
                  <Input
                    value={provider.clientId}
                    onChange={(e) => provider.setClientId(e.target.value)}
                    placeholder={`${provider.name} Client ID`}
                  />
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <Input
                    value={provider.clientSecret}
                    onChange={(e) => provider.setClientSecret(e.target.value)}
                    placeholder={`${provider.name} Client Secret`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirect URI: <code>{provider.redirectUri}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
