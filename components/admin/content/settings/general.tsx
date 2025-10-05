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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageTitle } from "../../SiteTitle";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function SettingsGeneral() {
  const [mode, setMode] = useState("DNSOnly");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [brandName, setBrandName] = useState("Netgoat");
  const [timezone, setTimezone] = useState("UTC");

  const handleSave = () => toast.success("Settings saved successfully 🎉");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <PageTitle
        title="General Settings"
        subtitle="Manage your Netgoat instance’s configuration, personalization, and preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operation Mode */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Operation Mode</h2>
            <p className="text-sm text-muted-foreground">
              Choose how your instance behaves on the network.
            </p>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={setMode} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Label htmlFor="dns">DNS Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Reverse proxy disabled.
                  </p>
                </div>
                <RadioGroupItem value="DNSOnly" id="dns" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <Label htmlFor="proxy">Reverse Proxy Only</Label>
                  <p className="text-sm text-muted-foreground">
                    DNS services disabled.
                  </p>
                </div>
                <RadioGroupItem value="RPO" id="proxy" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <Label htmlFor="both">DNS + Reverse Proxy</Label>
                  <p className="text-sm text-muted-foreground">
                    Combines both for full functionality.
                  </p>
                </div>
                <RadioGroupItem value="DARP" id="both" />
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Branding</h2>
            <p className="text-sm text-muted-foreground">
              Customize your instance identity.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="brand">Brand Name</Label>
            <Input
              id="brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name"
            />
            <Label>Logo</Label>
            <Input type="file" accept="image/*" />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Choose how your dashboard looks and feels.
            </p>
          </CardHeader>
          <CardContent>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Localization</h2>
            <p className="text-sm text-muted-foreground">
              Set language and timezone preferences.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lang">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fi">Finnish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/Helsinki">Europe/Helsinki</SelectItem>
                  <SelectItem value="America/New_York">America/New York</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Control alerts and email updates.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive system updates and security alerts.
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instance Info */}
        <Card className="col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Instance Info</h2>
            <p className="text-sm text-muted-foreground">
              Core details of your deployment.
            </p>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>
              <strong>Instance ID:</strong> netgoat-prod-frontend
            </p>
            <p>
              <strong>Region:</strong> EU (Helsinki)
            </p>
            <p>
              <strong>Uptime:</strong> 23 days
            </p>
            <p>
              <strong>Version:</strong> v2.8.14
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave} size="lg">
              Save All Changes
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Apply all pending changes</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
