"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Zap,
  Lock,
  AlertTriangle,
  Loader2,
  Megaphone // Replaced/Added icon
} from "lucide-react";
import {
  getGlobalSettings,
  updateGlobalSettings,
} from "@/actions/adminValues";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BANNER_VARIANTS } from "@/lib/banner-variants";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    siteName: "",
    registrationEnabled: true,
    maintenanceMode: false,
    sentryEnabled: false,
    sentryDsn: "",
    proEnabled: false,
    dnsEnabled: true,
    reverseProxyEnabled: true,
    userDomainLimit: 3,
    dnsRecordLimit: 50,
    organizationLimit: 1,
    auditLogRetentionDays: 30,
    globalBannerEnabled: false,
    globalBannerText: "",
    globalBannerVariant: "info",
    featureFlags: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsData = await getGlobalSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) return <div>Loading settings...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings & Configuration</CardTitle>
        <CardDescription>Configure system-wide settings, features, and limitations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center"><Globe className="mr-2 h-4 w-4"/> Major Integration</h3>
          <div className="rounded-lg border p-4 space-y-4">
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
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Disable access for non-admin users.</p>
            </div>
            <Switch 
              checked={settings.maintenanceMode || false} 
              onCheckedChange={(c) => setSettings({...settings, maintenanceMode: c})} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center"><Zap className="mr-2 h-4 w-4"/> Features</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Registration Enabled</Label>
              <Switch 
                checked={settings.registrationEnabled || false} 
                onCheckedChange={(c) => setSettings({...settings, registrationEnabled: c})} 
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Pro Features</Label>
              <Switch 
                checked={settings.proEnabled || false} 
                onCheckedChange={(c) => setSettings({...settings, proEnabled: c})} 
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>DNS Services</Label>
              <Switch 
                checked={settings.dnsEnabled || false} 
                onCheckedChange={(c) => setSettings({...settings, dnsEnabled: c})} 
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Reverse Proxy</Label>
              <Switch 
                checked={settings.reverseProxyEnabled || false} 
                onCheckedChange={(c) => setSettings({...settings, reverseProxyEnabled: c})} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center"><Lock className="mr-2 h-4 w-4"/> Limits & Quotas</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label>Audit Log Retention (Days)</Label>
              <Input 
                type="number" 
                value={settings.auditLogRetentionDays ?? 30} 
                onChange={(e) => setSettings({...settings, auditLogRetentionDays: parseInt(e.target.value)})} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center"><Megaphone className="mr-2 h-4 w-4"/> Global Banner</h3>
          
          <div className="rounded-lg border p-4">
             <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Global Banner</Label>
                  <p className="text-sm text-muted-foreground">Show a persistent banner at the top of every page.</p>
                </div>
                <Switch 
                  checked={settings.globalBannerEnabled || false} 
                  onCheckedChange={(c) => setSettings({...settings, globalBannerEnabled: c})} 
                />
            </div>
          
            {settings.globalBannerEnabled && (
              <div className="space-y-6 mt-4 pt-4 border-t">
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
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/> Experiments (Feature Flags)</h3>
          <div className="rounded-lg border p-4 space-y-4">
             <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Manage rollout of beta features globally or per percentage.</p>
                <Button variant="outline" size="sm" onClick={() => {
                  setSettings({
                    ...settings,
                    featureFlags: [...(settings.featureFlags || []), { key: "", description: "", isActive: false, percentage: 0 }]
                  })
                }}>+ Add Flag</Button>
             </div>
             
             <div className="space-y-4">
               {settings.featureFlags?.map((flag: any, index: number) => (
                 <div key={index} className="grid gap-4 items-start p-4 border rounded-md relative bg-background/50">
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
                    
                    <div className="flex items-center gap-6">
                       <div className="flex items-center space-x-2">
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
                       
                       <div className="flex items-center space-x-2 flex-1">
                          <Label className="whitespace-nowrap">Rollout %</Label>
                          <Input 
                             type="number" 
                             min={0} max={100}
                             value={flag.percentage}
                             onChange={(e) => {
                               const newFlags = [...settings.featureFlags];
                               newFlags[index].percentage = parseInt(e.target.value);
                               setSettings({...settings, featureFlags: newFlags});
                            }}
                          />
                       </div>
                    </div>
                 </div>
               ))}
               {(!settings.featureFlags || settings.featureFlags.length === 0) && (
                 <div className="text-center py-4 text-sm text-muted-foreground border-dashed border-2 rounded-md">
                   No feature flags defined.
                 </div>
               )}
             </div>
          </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
