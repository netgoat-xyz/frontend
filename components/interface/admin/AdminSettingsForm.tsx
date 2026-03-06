"use client";

import { useState } from "react";
import {
  Globe,
  Zap,
  Lock,
  AlertTriangle,
  Loader2,
  Megaphone,
  Settings,
  Save
} from "lucide-react";
import { updateGlobalSettings } from "@/actions/adminValues";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BANNER_VARIANTS } from "@/lib/banner-variants";
import { cn } from "@/lib/utils";

interface AdminSettingsFormProps {
  initialSettings: any;
}

export default function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [settings, setSettings] = useState<any>(initialSettings || {});
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updated = await updateGlobalSettings(settings);
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your global application configuration.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} size="lg" className="shadow-sm">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!saving && <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-card border-border border">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="mr-2 h-4 w-4" /> Features & Limits
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="mr-2 h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="banner">
             <Megaphone className="mr-2 h-4 w-4" /> Global Banner
          </TabsTrigger>
          <TabsTrigger value="experiments">
             <AlertTriangle className="mr-2 h-4 w-4" /> Experiments
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Basic settings for your NetGoat instance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input 
                      id="siteName"
                      value={settings.siteName || "NetGoat"} 
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})} 
                    />
                  </div>
                  
                  <div className="flex items-center bg-input/30 justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Registration Enabled</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to sign up.</p>
                    </div>
                    <Switch 
                      checked={settings.registrationEnabled || false} 
                      onCheckedChange={(c) => setSettings({...settings, registrationEnabled: c})} 
                    />
                  </div>

                  <div className="flex items-center bg-input/30 justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Disable access for non-admin users.</p>
                    </div>
                    <Switch 
                      checked={settings.maintenanceMode || false} 
                      onCheckedChange={(c) => setSettings({...settings, maintenanceMode: c})} 
                    />
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES & LIMITS TAB */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Core Features</CardTitle>
                  <CardDescription>Toggle optional functionalities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Pro Features</Label>
                    <Switch 
                      checked={settings.proEnabled || false} 
                      onCheckedChange={(c) => setSettings({...settings, proEnabled: c})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>DNS Services</Label>
                    <Switch 
                      checked={settings.dnsEnabled || false} 
                      onCheckedChange={(c) => setSettings({...settings, dnsEnabled: c})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Reverse Proxy</Label>
                    <Switch 
                      checked={settings.reverseProxyEnabled || false} 
                      onCheckedChange={(c) => setSettings({...settings, reverseProxyEnabled: c})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>System Limits</CardTitle>
                  <CardDescription>Default quotas for users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Domain Limit</Label>
                    <Input 
                      type="number" 
                      value={settings.userDomainLimit ?? 3} 
                      onChange={(e) => setSettings({...settings, userDomainLimit: parseInt(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DNS Record Limit</Label>
                    <Input 
                      type="number" 
                      value={settings.dnsRecordLimit ?? 50} 
                      onChange={(e) => setSettings({...settings, dnsRecordLimit: parseInt(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Limit</Label>
                    <Input 
                      type="number" 
                      value={settings.organizationLimit ?? 1} 
                      onChange={(e) => setSettings({...settings, organizationLimit: parseInt(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="integrations" className="space-y-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>External Integrations</CardTitle>
                <CardDescription>Connect with third-party services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-input/30 border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sentry Integration</Label>
                      <p className="text-sm text-muted-foreground">Enable Sentry error tracking for frontend monitoring.</p>
                    </div>
                    <Switch 
                      checked={settings.sentryEnabled || false} 
                      onCheckedChange={(c) => setSettings({...settings, sentryEnabled: c})} 
                    />
                  </div>
                  {settings.sentryEnabled && (
                    <div className="space-y-2">
                      <Label>Sentry DSN (Data Source Name)</Label>
                      <Input 
                          placeholder="https://examplePublicKey@o0.ingest.sentry.io/0"
                          value={settings.sentryDsn || ""}
                          onChange={(e) => setSettings({...settings, sentryDsn: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">The DSN tells the SDK where to send the events. You can find this in your Sentry project settings.</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                   <Label>Audit Log Retention (Days)</Label>
                    <Input 
                      type="number" 
                      value={settings.auditLogRetentionDays ?? 30} 
                      onChange={(e) => setSettings({...settings, auditLogRetentionDays: parseInt(e.target.value)})} 
                    />
                    <p className="text-xs text-muted-foreground">How long to keep system activity logs.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BANNER TAB */}
          <TabsContent value="banner" className="space-y-4">
             <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
                <CardHeader>
                   <CardTitle>Global Announcement Banner</CardTitle>
                   <CardDescription>Display a persistent message at the top of the site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Banner</Label>
                        </div>
                        <Switch 
                          checked={settings.globalBannerEnabled || false} 
                          onCheckedChange={(c) => setSettings({...settings, globalBannerEnabled: c})} 
                        />
                    </div>
                  
                    {settings.globalBannerEnabled && (
                      <div className="space-y-6 p-4 border rounded-lg bg-input/30">
                        {/* Live Preview */}
                        <div className="space-y-2">
                          <Label>Live Preview</Label>
                          <div className={cn(
                            "w-full py-2 px-4 text-center text-sm rounded-md shadow-sm transition-all",
                            BANNER_VARIANTS[settings.globalBannerVariant || "info"]?.classes || "bg-blue-500 text-white"
                          )}>
                            {settings.globalBannerText || "Banner Text Payload..."}
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Message Content</Label>
                            <Input 
                              value={settings.globalBannerText || ""} 
                              onChange={(e) => setSettings({...settings, globalBannerText: e.target.value})} 
                              placeholder="e.g. Scheduled maintenance at 00:00 UTC."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Banner Theme</Label>
                            <Select 
                              value={settings.globalBannerVariant || "info"} 
                              onValueChange={(v) => setSettings({...settings, globalBannerVariant: v})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BANNER_VARIANTS).map(([key, variant]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-3 h-3 rounded-full", variant.classes.split(" ")[0])} />
                                      {variant.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
             </Card>
          </TabsContent>

          {/* EXPERIMENTS TAB */}
          <TabsContent value="experiments" className="space-y-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                     <CardTitle>Feature Flags & Experiments</CardTitle>
                     <CardDescription>Manage beta features and rollouts.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                      setSettings({
                        ...settings,
                        featureFlags: [...(settings.featureFlags || []), { key: "new-feature", description: "Description", isActive: false, percentage: 0, variants: [] }]
                      })
                    }}>
                     + Add Flag
                  </Button>
               </CardHeader>
               <CardContent className="space-y-4">
                   {settings.featureFlags?.map((flag: any, index: number) => (
                     <div key={index} className="grid gap-4 items-start p-4 border rounded-lg bg-input/30 text-card-foreground shadow-sm relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                             const newFlags = [...settings.featureFlags];
                             newFlags.splice(index, 1);
                             setSettings({...settings, featureFlags: newFlags});
                          }}
                        >
                          <span className="text-lg">&times;</span>
                        </Button>

                        <div className="grid md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>Feature Key</Label>
                              <Input 
                                value={flag.key} 
                                className="font-mono text-sm"
                                placeholder="e.g. new-dashboard"
                                onChange={(e) => {
                                   const newFlags = [...settings.featureFlags];
                                   newFlags[index].key = e.target.value;
                                   setSettings({...settings, featureFlags: newFlags});
                                }}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>Description</Label>
                              <Input 
                                value={flag.description} 
                                placeholder="Internal description"
                                onChange={(e) => {
                                   const newFlags = [...settings.featureFlags];
                                   newFlags[index].description = e.target.value;
                                   setSettings({...settings, featureFlags: newFlags});
                                }}
                              />
                           </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 pt-2">
                           <div className="flex items-center space-x-2 border rounded px-3 py-2 bg-input/30">
                              <Switch 
                                checked={flag.isActive}
                                onCheckedChange={(c) => {
                                   const newFlags = [...settings.featureFlags];
                                   newFlags[index].isActive = c;
                                   setSettings({...settings, featureFlags: newFlags});
                                }}
                              />
                              <Label>Globally Active</Label>
                           </div>
                           
                           <div className="flex items-center space-x-2 flex-1 min-w-50">
                              <Label className="whitespace-nowrap">Rollout %</Label>
                              <div className="flex items-center w-full gap-2">
                                <Input 
                                   type="range"
                                   min={0} max={100}
                                   className="flex-1"
                                   value={flag.percentage}
                                   onChange={(e) => {
                                      const newFlags = [...settings.featureFlags];
                                      newFlags[index].percentage = parseInt(e.target.value);
                                      setSettings({...settings, featureFlags: newFlags});
                                   }}
                                />
                                <span className="w-12 text-center text-sm font-mono border rounded px-1">{flag.percentage}%</span>
                              </div>
                           </div>
                        </div>

                        {/* Variants Management */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Variants (comma separated)</Label>
                            <Input 
                                placeholder="blue, red, green"
                                value={flag.variants ? flag.variants.join(", ") : ""}
                                onChange={(e) => {
                                    const newFlags = [...settings.featureFlags];
                                    newFlags[index].variants = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                    setSettings({...settings, featureFlags: newFlags});
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Allows multi-option experiments (e.g. A/B/C testing).</p>
                        </div>
                     </div>
                   ))}
                   {(!settings.featureFlags || settings.featureFlags.length === 0) && (
                     <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                       No feature flags defined. Click "+ Add Flag" to start.
                     </div>
                   )}
               </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
