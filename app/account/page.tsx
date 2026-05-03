"use client";

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
import { CustomSelect } from "@/components/ui/custom-select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion } from "motion/react";
import { Loader2, Camera, UserCircle, Shield, Users, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAppSession } from "@/components/auth/AppSessionContext";

const categories = [
  { name: "General", icon: UserCircle },
  { name: "Security", icon: Shield },
  { name: "Teams", icon: Users },
  { name: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("General");

  const session = useAppSession();
  const user = session?.user;

  // General State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPasswordUser, setIsPasswordUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Security State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [magicLinkEnabled, setMagicLinkEnabled] = useState(true);
  const [emailCodeEnabled, setEmailCodeEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);

  // Teams State
  const [teamInviteDomain, setTeamInviteDomain] = useState("");
  const [requireInviteApproval, setRequireInviteApproval] = useState(true);

  // Notifications State
  const [productUpdates, setProductUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [teamActivityAlerts, setTeamActivityAlerts] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("daily");

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

  function getSecurityStorageKey(userEmail: string) {
    return `account-security:${userEmail.toLowerCase()}`;
  }

  useEffect(() => {
    if (!user?.email) return;

    try {
      const raw = localStorage.getItem(getSecurityStorageKey(user.email));
      if (!raw) return;

      const prefs = JSON.parse(raw) as {
        mfaEnabled?: boolean;
        magicLinkEnabled?: boolean;
        emailCodeEnabled?: boolean;
        sessionTimeout?: number;
      };

      setMfaEnabled(Boolean(prefs.mfaEnabled));
      setMagicLinkEnabled(prefs.magicLinkEnabled ?? true);
      setEmailCodeEnabled(prefs.emailCodeEnabled ?? true);
      setSessionTimeout(String(prefs.sessionTimeout ?? 30));
    } catch (e) {
      console.error("Failed to load security preferences", e);
    }
  }, [user?.email]);

  function handleToggleMagicLink(checked: boolean) {
    if (!checked && !emailCodeEnabled) {
      setSecurityFeedback(
        "At least one email verification method must remain enabled.",
      );
      return;
    }
    setSecurityFeedback(null);
    setMagicLinkEnabled(checked);
  }

  function handleToggleEmailCode(checked: boolean) {
    if (!checked && !magicLinkEnabled) {
      setSecurityFeedback(
        "At least one email verification method must remain enabled.",
      );
      return;
    }
    setSecurityFeedback(null);
    setEmailCodeEnabled(checked);
  }

  async function handleSaveSecuritySettings() {
    if (!user?.email) {
      setSecurityFeedback("No user session found. Please refresh and try again.");
      return;
    }

    if (!magicLinkEnabled && !emailCodeEnabled) {
      setSecurityFeedback(
        "Enable Magic Link or Email Code before saving your security settings.",
      );
      return;
    }

    setIsSavingSecurity(true);
    setSecurityFeedback(null);

    try {
      const normalizedTimeout = Math.min(
        240,
        Math.max(5, Number.parseInt(sessionTimeout || "30", 10) || 30),
      );

      setSessionTimeout(String(normalizedTimeout));

      localStorage.setItem(
        getSecurityStorageKey(user.email),
        JSON.stringify({
          mfaEnabled,
          magicLinkEnabled,
          emailCodeEnabled,
          sessionTimeout: normalizedTimeout,
        }),
      );

      setSecurityFeedback("Security settings saved.");
    } catch (e) {
      console.error("Failed to save security settings", e);
      setSecurityFeedback("Failed to save security settings. Please try again.");
    } finally {
      setIsSavingSecurity(false);
    }
  }

  return (
    <div className="mx-6">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-neutral-400 mt-2">
            Manage your profile, security, team, and notification preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveSection(cat.name)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                      isActive
                        ? "bg-neutral-900 text-white font-medium"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="user-settings-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"
                      />
                    )}
                    <Icon className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 mx-12">
            {/* --- GENERAL SECTION --- */}
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
                    className="space-y-5"
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

            {/* --- SECURITY SECTION --- */}
            {activeSection === "Security" && (
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Security Controls</CardTitle>
                  <CardDescription>
                    Configure login and session hardening settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Password</h4>
                      <p className="text-xs text-muted-foreground">
                        Rotate your password regularly to reduce account risk.
                      </p>
                      {!isPasswordUser && (
                        <p className="text-[11px] text-amber-500/80 mt-1">
                          This account signs in via SSO and does not use a local password.
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" disabled={!isPasswordUser}>
                      Change password
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="mfa" className="text-sm font-medium">
                        Two-factor authentication
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add an extra verification step at sign-in.
                      </p>
                    </div>
                    <Switch
                      id="mfa"
                      checked={mfaEnabled}
                      onCheckedChange={setMfaEnabled}
                    />
                  </div>

                  <div className="rounded-lg border p-4 space-y-5 bg-muted/20">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">
                        Email verification methods
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Choose which verification options can be used when
                        signing in with email.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label
                          htmlFor="magic-link-method"
                          className="text-sm font-medium"
                        >
                          Magic Link
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sends a secure sign-in link to your email.
                        </p>
                      </div>
                      <Switch
                        id="magic-link-method"
                        checked={magicLinkEnabled}
                        onCheckedChange={handleToggleMagicLink}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label
                          htmlFor="email-code-method"
                          className="text-sm font-medium"
                        >
                          One-time code
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sends a one-time numerical code to your email.
                        </p>
                      </div>
                      <Switch
                        id="email-code-method"
                        checked={emailCodeEnabled}
                        onCheckedChange={handleToggleEmailCode}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 max-w-xs pt-2">
                    <Label
                      htmlFor="session-timeout"
                      className="text-sm font-medium"
                    >
                      Session timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min={5}
                      max={240}
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    />
                  </div>

                  {securityFeedback && (
                    <p
                      className={`text-xs font-medium ${securityFeedback === "Security settings saved." ? "text-emerald-500" : "text-amber-500"}`}
                    >
                      {securityFeedback}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="border-t flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSecuritySettings}
                    disabled={isSavingSecurity}
                  >
                    {isSavingSecurity ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isSavingSecurity ? "Saving..." : "Save security settings"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* --- TEAMS SECTION --- */}
            {activeSection === "Teams" && (
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Team Preferences</CardTitle>
                  <CardDescription>
                    Manage collaboration defaults for your workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <h4 className="text-sm font-semibold">Current Account Session</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acting on behalf of <span className="font-medium text-foreground">{user?.email || "Unknown user"}</span>
                    </p>
                  </div>

                  <div className="grid gap-2 max-w-md">
                    <Label htmlFor="invite-domain" className="text-sm font-medium">
                      Allowed Invite Domain
                    </Label>
                    <Input
                      id="invite-domain"
                      placeholder="e.g. yourcompany.com"
                      value={teamInviteDomain}
                      onChange={(e) => setTeamInviteDomain(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Leave empty to allow invitations from any domain.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="invite-approval"
                        className="text-sm font-medium"
                      >
                        Require owner approval
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        New member invites must be approved by an owner before joining.
                      </p>
                    </div>
                    <Switch
                      id="invite-approval"
                      checked={requireInviteApproval}
                      onCheckedChange={setRequireInviteApproval}
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t flex justify-end">
                  <Button type="button" size="sm">
                    Save team settings
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* --- NOTIFICATIONS SECTION --- */}
            {activeSection === "Notifications" && (
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose when and how updates are delivered to you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="product-updates"
                        className="text-sm font-medium"
                      >
                        Product Updates
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive news about feature launches and release notes.
                      </p>
                    </div>
                    <Switch
                      id="product-updates"
                      checked={productUpdates}
                      onCheckedChange={setProductUpdates}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="security-alerts"
                        className="text-sm font-medium"
                      >
                        Security Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Suspicious sign-ins, password events, and risk notices.
                      </p>
                    </div>
                    <Switch
                      id="security-alerts"
                      checked={securityAlerts}
                      onCheckedChange={setSecurityAlerts}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="team-activity"
                        className="text-sm font-medium"
                      >
                        Team Activity
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mentions, ownership changes, and invite activity.
                      </p>
                    </div>
                    <Switch
                      id="team-activity"
                      checked={teamActivityAlerts}
                      onCheckedChange={setTeamActivityAlerts}
                    />
                  </div>

                  <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                    <Label
                      htmlFor="digest-frequency"
                      className="text-sm font-medium"
                    >
                      Email Digest Frequency
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      How often would you like to receive summary reports?
                    </p>
                    <CustomSelect
                      id="digest-frequency"
                      value={digestFrequency}
                      onValueChange={setDigestFrequency}
                      options={[
                        { value: "instant", label: "Instant delivery" },
                        { value: "daily", label: "Daily digest" },
                        { value: "weekly", label: "Weekly digest" },
                      ]}
                      triggerClassName="max-w-[200px]"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t flex justify-end">
                  <Button type="button" size="sm">
                    Save notification settings
                  </Button>
                </CardFooter>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}