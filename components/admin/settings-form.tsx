"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  FloppyDiskIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";

import { updateSettingsAction } from "@/actions/admin-settings";
import { FormError } from "@/components/auth/auth-card";
import { DynamicRulesSettings } from "@/components/admin/dynamic-rules-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  BANNER_VARIANTS,
  bannerVariantOrDefault,
  type BannerVariant,
} from "@/lib/banner-variants";
import type { AdminSettings, PublicFeatureFlag } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

const BANNER_ITEMS = Object.entries(BANNER_VARIANTS).map(([value, config]) => ({
  label: config.label,
  value,
}));

type ToggleSpec = {
  key:
    | "registrationEnabled"
    | "maintenanceMode"
    | "proEnabled"
    | "dnsEnabled"
    | "reverseProxyEnabled"
    | "sentryEnabled";
  label: string;
  description: string;
};

const GENERAL_TOGGLES: ToggleSpec[] = [
  {
    key: "registrationEnabled",
    label: "Registration enabled",
    description: "Allow new accounts to sign up.",
  },
  {
    key: "maintenanceMode",
    label: "Maintenance mode",
    description: "Show the maintenance page to everyone except admins.",
  },
];

const FEATURE_TOGGLES: ToggleSpec[] = [
  {
    key: "proEnabled",
    label: "Pro features",
    description: "Enable the paid tier across the dashboard.",
  },
  {
    key: "dnsEnabled",
    label: "DNS services",
    description: "Allow teams to manage DNS records.",
  },
  {
    key: "reverseProxyEnabled",
    label: "Reverse proxy",
    description: "Allow teams to configure upstream pools.",
  },
];

const LIMIT_FIELDS: Array<{
  key:
    | "userDomainLimit"
    | "dnsRecordLimit"
    | "organizationLimit"
    | "auditLogRetentionDays";
  label: string;
  description: string;
}> = [
  {
    key: "userDomainLimit",
    label: "Domains per user",
    description: "Default domain quota for new accounts.",
  },
  {
    key: "dnsRecordLimit",
    label: "DNS records per domain",
    description: "Cap on records inside one domain.",
  },
  {
    key: "organizationLimit",
    label: "Organizations per user",
    description: "How many org teams a user may create.",
  },
  {
    key: "auditLogRetentionDays",
    label: "Audit log retention",
    description: "Days of audit history to keep.",
  },
];

/** Platform settings form. Saves through a strictly validated action. */
export function SettingsForm({ initialSettings }: { initialSettings: AdminSettings }) {
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bannerVariant = bannerVariantOrDefault(settings.globalBannerVariant);

  function update<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateFlag(index: number, patch: Partial<PublicFeatureFlag>) {
    setSettings((current) => {
      const featureFlags = [...current.featureFlags];
      const existing = featureFlags[index];
      if (!existing) return current;
      featureFlags[index] = { ...existing, ...patch };
      return { ...current, featureFlags };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);

    const result = await updateSettingsAction({
      siteName: settings.siteName,
      registrationEnabled: settings.registrationEnabled,
      maintenanceMode: settings.maintenanceMode,
      sentryEnabled: settings.sentryEnabled,
      sentryDsn: settings.sentryDsn,
      proEnabled: settings.proEnabled,
      dnsEnabled: settings.dnsEnabled,
      reverseProxyEnabled: settings.reverseProxyEnabled,
      userDomainLimit: settings.userDomainLimit,
      dnsRecordLimit: settings.dnsRecordLimit,
      organizationLimit: settings.organizationLimit,
      auditLogRetentionDays: settings.auditLogRetentionDays,
      globalBannerEnabled: settings.globalBannerEnabled,
      globalBannerText: settings.globalBannerText,
      globalBannerVariant: settings.globalBannerVariant,
      featureFlags: settings.featureFlags,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "Settings saved",
      description: "Marketing and dashboard surfaces pick this up immediately.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">
          Changes apply platform-wide, including the public site.
        </p>
        <Button className="ms-auto" disabled={saving} onClick={save}>
          {saving ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} />
          )}
          Save settings
        </Button>
      </div>

      <FormError message={error} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="edge-rules">Edge rules</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Identity and availability of the platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field>
                <FieldLabel htmlFor="settings-site-name">Site name</FieldLabel>
                <Input
                  id="settings-site-name"
                  value={settings.siteName}
                  maxLength={100}
                  onChange={(event) => update("siteName", event.target.value)}
                />
              </Field>

              {GENERAL_TOGGLES.map((toggle) => (
                <div key={toggle.key} className="flex items-start gap-3">
                  <Switch
                    checked={settings[toggle.key]}
                    onCheckedChange={(checked) => update(toggle.key, checked)}
                    aria-label={toggle.label}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{toggle.label}</span>
                    <span className="text-muted-foreground text-sm">
                      {toggle.description}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>Turn product areas on or off globally.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {FEATURE_TOGGLES.map((toggle) => (
                  <div key={toggle.key} className="flex items-start gap-3">
                    <Switch
                      checked={settings[toggle.key]}
                      onCheckedChange={(checked) => update(toggle.key, checked)}
                      aria-label={toggle.label}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{toggle.label}</span>
                      <span className="text-muted-foreground text-sm">
                        {toggle.description}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default limits</CardTitle>
                <CardDescription>Applied to new accounts and teams.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {LIMIT_FIELDS.map((field) => (
                  <Field key={field.key}>
                    <FieldLabel htmlFor={`settings-${field.key}`}>
                      {field.label}
                    </FieldLabel>
                    <Input
                      id={`settings-${field.key}`}
                      type="number"
                      min={0}
                      value={settings[field.key]}
                      onChange={(event) =>
                        update(
                          field.key,
                          Number.parseInt(event.target.value || "0", 10),
                        )
                      }
                    />
                    <FieldDescription>{field.description}</FieldDescription>
                  </Field>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="banner" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Global banner</CardTitle>
              <CardDescription>
                Announcements rendered above the site for every visitor.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <Switch
                  checked={settings.globalBannerEnabled}
                  onCheckedChange={(checked) => update("globalBannerEnabled", checked)}
                  aria-label="Enable banner"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Enable banner</span>
                  <span className="text-muted-foreground text-sm">
                    Turn the announcement strip on.
                  </span>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="settings-banner-text">Message</FieldLabel>
                <Textarea
                  id="settings-banner-text"
                  value={settings.globalBannerText}
                  rows={2}
                  maxLength={500}
                  onChange={(event) => update("globalBannerText", event.target.value)}
                  placeholder="Scheduled maintenance on Sunday 02:00–03:00 UTC."
                />
              </Field>

              <Field>
                <FieldLabel>Theme</FieldLabel>
                <Select
                  items={BANNER_ITEMS}
                  value={bannerVariant}
                  onValueChange={(next) =>
                    update(
                      "globalBannerVariant",
                      (next as BannerVariant) ?? "info",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {BANNER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Preview</span>
                <div
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    BANNER_VARIANTS[bannerVariant].classes,
                  )}
                >
                  {settings.globalBannerText ||
                    "Your announcement text appears here."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature flags</CardTitle>
              <CardDescription>
                Percentage rollouts and named variants for in-progress work.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {settings.featureFlags.map((flag, index) => (
                <div
                  key={`${flag.key}-${index}`}
                  className="flex flex-col gap-3 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      aria-label={`Flag ${index + 1} key`}
                      value={flag.key}
                      maxLength={50}
                      placeholder="new-dashboard"
                      onChange={(event) => updateFlag(index, { key: event.target.value })}
                      className="max-w-xs"
                    />
                    <Badge variant={flag.isActive ? "success" : "outline"}>
                      {flag.isActive ? "Active" : "Off"}
                    </Badge>
                    <div className="flex h-9 items-center gap-2">
                      <Switch
                        checked={flag.isActive}
                        onCheckedChange={(checked) =>
                          updateFlag(index, { isActive: checked })
                        }
                        aria-label={`Toggle flag ${flag.key}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ms-auto"
                      aria-label={`Remove flag ${flag.key}`}
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          featureFlags: current.featureFlags.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                      }
                    >
                      <HugeiconsIcon icon={Delete02Icon} />
                    </Button>
                  </div>

                  <Input
                    aria-label={`Flag ${index + 1} description`}
                    value={flag.description}
                    maxLength={200}
                    placeholder="What does this flag change?"
                    onChange={(event) =>
                      updateFlag(index, { description: event.target.value })
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                    <Field>
                      <FieldLabel htmlFor={`flag-variants-${index}`}>
                        Variants
                      </FieldLabel>
                      <Input
                        id={`flag-variants-${index}`}
                        value={flag.variants.join(", ")}
                        placeholder="control, treatment"
                        onChange={(event) =>
                          updateFlag(index, {
                            variants: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                      <FieldDescription>Comma-separated variant names.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`flag-percentage-${index}`}>
                        Rollout {flag.percentage}%
                      </FieldLabel>
                      <input
                        id={`flag-percentage-${index}`}
                        type="range"
                        min={0}
                        max={100}
                        value={flag.percentage}
                        onChange={(event) =>
                          updateFlag(index, {
                            percentage: Number.parseInt(event.target.value, 10),
                          })
                        }
                        className="accent-primary h-9 w-full"
                      />
                    </Field>
                  </div>
                </div>
              ))}

              {settings.featureFlags.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No flags yet. Add one to start a rollout.
                </p>
              ) : null}

              <Button
                variant="outline"
                disabled={settings.featureFlags.length >= 50}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    featureFlags: [
                      ...current.featureFlags,
                      {
                        key: "new-feature",
                        description: "",
                        isActive: false,
                        percentage: 0,
                        variants: [],
                      },
                    ],
                  }))
                }
              >
                <HugeiconsIcon icon={PlusSignIcon} />
                Add flag
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge-rules" className="mt-4">
          <DynamicRulesSettings initialConfig={settings.dynamicRules} />
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>External services the platform reports to.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <Switch
                  checked={settings.sentryEnabled}
                  onCheckedChange={(checked) => update("sentryEnabled", checked)}
                  aria-label="Sentry integration"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Sentry</span>
                  <span className="text-muted-foreground text-sm">
                    Forward server errors to a Sentry project.
                  </span>
                </div>
              </div>

              {settings.sentryEnabled ? (
                <Field>
                  <FieldLabel htmlFor="settings-sentry-dsn">Sentry DSN</FieldLabel>
                  <Input
                    id="settings-sentry-dsn"
                    value={settings.sentryDsn}
                    maxLength={500}
                    placeholder="https://examplePublicKey@o0.ingest.sentry.io/0"
                    onChange={(event) => update("sentryDsn", event.target.value)}
                  />
                  <FieldDescription>
                    Stored with the settings document; only admins can read it.
                  </FieldDescription>
                </Field>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button disabled={saving} onClick={save}>
          {saving ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} />
          )}
          Save settings
        </Button>
      </div>
    </div>
  );
}
