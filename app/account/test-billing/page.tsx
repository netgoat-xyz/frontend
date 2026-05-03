"use client";

import {
  createDebugInvoice,
  createPolarCheckoutSession,
  createPolarCustomerPortalSession,
  getBillingOverview,
  runBillingDebugTests,
  updateBillingSettings,
} from "@/actions/billing";
import {
  runDeveloperAnalyticsProbe,
  sendDeveloperDebugEmail,
  type DebugEmailTemplate,
} from "@/actions/debug";
import { getExperiments } from "@/actions/experiments";
import { CustomSelect } from "@/components/ui/custom-select";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BillingOverviewResponse = Awaited<ReturnType<typeof getBillingOverview>>;
type BillingDebugResponse = Awaited<ReturnType<typeof runBillingDebugTests>>;
type BillingSettingsResponse = Awaited<ReturnType<typeof updateBillingSettings>>;
type DebugInvoiceResponse = Awaited<ReturnType<typeof createDebugInvoice>>;
type PolarCheckoutResponse = Awaited<ReturnType<typeof createPolarCheckoutSession>>;
type PolarPortalResponse = Awaited<ReturnType<typeof createPolarCustomerPortalSession>>;
type DebugEmailResponse = Awaited<ReturnType<typeof sendDeveloperDebugEmail>>;
type AnalyticsProbeResponse = Awaited<ReturnType<typeof runDeveloperAnalyticsProbe>>;
type BillingInterval = "monthly" | "annual";

type LastActionPayload =
  | BillingOverviewResponse
  | BillingDebugResponse
  | BillingSettingsResponse
  | DebugInvoiceResponse
  | PolarCheckoutResponse
  | PolarPortalResponse
  | DebugEmailResponse
  | AnalyticsProbeResponse
  | null;

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return fallback;
}

function isDeveloperModeTestingEnabled(
  flags: Record<string, boolean | string> | null | undefined,
) {
  const rawValue =
    flags?.Developer_Mode_Testing ??
    flags?.developer_mode_testing ??
    flags?.DEVELOPER_MODE_TESTING;

  if (rawValue === true) return true;

  if (typeof rawValue === "string") {
    return rawValue.trim().toLowerCase() === "true";
  }

  return false;
}

export default function TestBillingPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("@me");
  const [requestedPlan, setRequestedPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [requestedInterval, setRequestedInterval] = useState<BillingInterval>("monthly");
  const [requestedSeats, setRequestedSeats] = useState(1);

  const [billingEmail, setBillingEmail] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [autoRecharge, setAutoRecharge] = useState(true);

  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [debugReport, setDebugReport] = useState<BillingDebugResponse | null>(null);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastActionName, setLastActionName] = useState<string>("none");
  const [lastActionAt, setLastActionAt] = useState<string>("-");
  const [lastPayload, setLastPayload] = useState<LastActionPayload>(null);
  const [canViewTestingTools, setCanViewTestingTools] = useState(false);
  const [flagCheckComplete, setFlagCheckComplete] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailTemplate, setEmailTemplate] =
    useState<DebugEmailTemplate>("welcome");
  const [inviteTeamName, setInviteTeamName] = useState("Debug Team");
  const [inviteRoleName, setInviteRoleName] = useState("member");
  const [inviteLink, setInviteLink] = useState("");
  const [magicLinkUrl, setMagicLinkUrl] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sendingDebugEmail, setSendingDebugEmail] = useState(false);
  const [debugEmailResult, setDebugEmailResult] =
    useState<DebugEmailResponse | null>(null);
  const [analyticsPath, setAnalyticsPath] = useState("/debug");
  const [analyticsVisitorId, setAnalyticsVisitorId] = useState("");
  const [runningAnalyticsProbe, setRunningAnalyticsProbe] = useState(false);
  const [analyticsProbeResult, setAnalyticsProbeResult] =
    useState<AnalyticsProbeResponse | null>(null);

  const normalizedSlug = useMemo(() => {
    const trimmed = slug.trim();
    return trimmed.length > 0 ? trimmed : "@me";
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const checkDeveloperModeFlag = async () => {
      try {
        const flags = await getExperiments();
        const enabled = isDeveloperModeTestingEnabled(
          flags as Record<string, boolean | string> | null | undefined,
        );

        if (cancelled) return;

        setCanViewTestingTools(enabled);
        setFlagCheckComplete(true);

        if (!enabled) {
          router.replace("/account/settings");
        }
      } catch {
        if (cancelled) return;
        setCanViewTestingTools(false);
        setFlagCheckComplete(true);
        router.replace("/account/settings");
      }
    };

    checkDeveloperModeFlag();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const canManageBilling = overview?.permissions?.canManageBilling ?? false;
  const canManageInvoices = overview?.permissions?.canManageInvoices ?? false;

  function trackAction(name: string, payload: LastActionPayload) {
    setLastActionName(name);
    setLastActionAt(new Date().toISOString());
    setLastPayload(payload);
  }

  async function handleLoadOverview() {
    try {
      setBusyAction("load-overview");
      const response = await getBillingOverview(normalizedSlug);
      setOverview(response);
      setBillingEmail(response.billingEmail || "");
      setInvoiceEmail(response.invoiceEmail || "");
      setPoNumber(response.poNumber || "");
      setEmailRecipient((current) => {
        if (current.trim().length > 0) {
          return current;
        }

        return response.billingEmail || response.invoiceEmail || "";
      });
      setAutoRecharge(Boolean(response.autoRecharge));
      setRequestedInterval(response.billingInterval === "annual" ? "annual" : "monthly");
      setRequestedSeats(Math.max(1, Math.floor(Number(response.seatCount || 1) || 1)));
      trackAction("getBillingOverview", response);
      toast.success("Billing overview loaded.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load billing overview."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();

    try {
      setBusyAction("save-settings");
      const normalizedSeats = Math.min(
        1000,
        Math.max(1, Math.floor(Number(requestedSeats) || 1)),
      );

      setRequestedSeats(normalizedSeats);

      const response = await updateBillingSettings(normalizedSlug, {
        billingEmail,
        invoiceEmail,
        poNumber,
        autoRecharge,
        billingInterval: requestedInterval,
        seatCount: normalizedSeats,
      });
      trackAction("updateBillingSettings", response);
      toast.success("Billing settings saved.");

      const refreshed = await getBillingOverview(normalizedSlug);
      setOverview(refreshed);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save billing settings."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRunDiagnostics() {
    try {
      setBusyAction("run-diagnostics");
      const response = await runBillingDebugTests(normalizedSlug);
      setDebugReport(response);
      trackAction("runBillingDebugTests", response);

      if (response.success) {
        toast.success("Billing diagnostics passed.");
      } else {
        toast.error("Billing diagnostics found issues.");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to run billing diagnostics."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateDebugInvoice() {
    try {
      setBusyAction("create-debug-invoice");
      const response = await createDebugInvoice(normalizedSlug);
      trackAction("createDebugInvoice", response);
      toast.success("Debug invoice created.");

      const refreshed = await getBillingOverview(normalizedSlug);
      setOverview(refreshed);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create debug invoice."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateCheckout() {
    try {
      setBusyAction("create-checkout");
      const normalizedSeats = Math.min(
        1000,
        Math.max(1, Math.floor(Number(requestedSeats) || 1)),
      );

      setRequestedSeats(normalizedSeats);

      const response = await createPolarCheckoutSession(
        normalizedSlug,
        requestedPlan,
        requestedInterval,
        normalizedSeats,
      );
      trackAction("createPolarCheckoutSession", response);

      const checkoutUrl = String(response.checkoutUrl || "");
      if (!checkoutUrl) {
        throw new Error("Polar checkout URL is missing.");
      }

      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      toast.success("Polar checkout opened in a new tab.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create Polar checkout session."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleOpenPortal() {
    try {
      setBusyAction("open-portal");
      const response = await createPolarCustomerPortalSession(normalizedSlug);
      trackAction("createPolarCustomerPortalSession", response);

      const portalUrl = String(response.customerPortalUrl || "");
      if (!portalUrl) {
        throw new Error("Polar customer portal URL is missing.");
      }

      window.open(portalUrl, "_blank", "noopener,noreferrer");
      toast.success("Polar customer portal opened in a new tab.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to open Polar customer portal."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSendDebugEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!emailRecipient.trim()) {
      toast.error("Enter an email recipient first.");
      return;
    }

    try {
      setSendingDebugEmail(true);
      const response = await sendDeveloperDebugEmail({
        to: emailRecipient,
        template: emailTemplate,
        teamName: inviteTeamName,
        roleName: inviteRoleName,
        inviteLink,
        magicLinkUrl,
        otpCode,
      });

      setDebugEmailResult(response);
      trackAction("sendDeveloperDebugEmail", response);
      toast.success(`Debug ${emailTemplate} email sent.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send debug email."));
    } finally {
      setSendingDebugEmail(false);
    }
  }

  async function handleRunAnalyticsProbe(e: React.FormEvent) {
    e.preventDefault();

    try {
      setRunningAnalyticsProbe(true);
      const response = await runDeveloperAnalyticsProbe({
        path: analyticsPath,
        visitorId: analyticsVisitorId,
      });

      setAnalyticsProbeResult(response);
      trackAction("runDeveloperAnalyticsProbe", response);
      toast.success("Analytics probe events tracked.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to run analytics probe."));
    } finally {
      setRunningAnalyticsProbe(false);
    }
  }

  const isBusy = busyAction !== null;

  if (!flagCheckComplete) {
    return null;
  }

  if (!canViewTestingTools) {
    return null;
  }

  return (
    <div className="mx-6">
      <div className="mx-auto max-w-7xl px-6 py-10 text-white">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Developer Debug Console</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Test payment, email, and analytics flows from one place.
          </p>
        </header>

        <div className="mb-6 grid gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-neutral-300">Team Slug</span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="@me"
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <div className="space-y-2 text-sm">
            <span className="text-neutral-300">Actions</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLoadOverview}
                disabled={isBusy}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "load-overview" ? "Loading..." : "Load Overview"}
              </button>

              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isBusy}
                className="rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "run-diagnostics" ? "Running..." : "Run Diagnostics"}
              </button>

              <button
                type="button"
                onClick={handleCreateDebugInvoice}
                disabled={isBusy || !canManageInvoices}
                className="rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "create-debug-invoice" ? "Creating..." : "Create Debug Invoice"}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-neutral-300">Permissions</span>
            <div className="rounded-md border border-neutral-800 bg-neutral-800/60 px-3 py-2 text-neutral-300">
              <p>
                Billing manage: <strong>{String(canManageBilling)}</strong>
              </p>
              <p>
                Invoice manage: <strong>{String(canManageInvoices)}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="mb-4 text-lg font-semibold">Billing Settings Test</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="text-neutral-300">Billing Email</span>
                <input
                  value={billingEmail}
                  onChange={(event) => setBillingEmail(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="billing@example.com"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-neutral-300">Invoice Email</span>
                <input
                  value={invoiceEmail}
                  onChange={(event) => setInvoiceEmail(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="invoices@example.com"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-neutral-300">PO Number</span>
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="PO-2026-001"
                />
              </label>

              <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/60 px-3 py-2 text-sm">
                <span>Auto Recharge</span>
                <input
                  type="checkbox"
                  checked={autoRecharge}
                  onChange={(event) => setAutoRecharge(event.target.checked)}
                  className="h-4 w-4"
                />
              </label>

              <button
                type="submit"
                disabled={isBusy || !canManageBilling}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "save-settings" ? "Saving..." : "Save Billing Settings"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="mb-4 text-lg font-semibold">Polar Session Test</h2>

            <div className="space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-neutral-300">Checkout Plan</span>
                <CustomSelect
                  value={requestedPlan}
                  onValueChange={(value) =>
                    setRequestedPlan(
                      value === "enterprise"
                        ? "enterprise"
                        : value === "free"
                          ? "free"
                          : "pro",
                    )
                  }
                  options={[
                    { value: "free", label: "free" },
                    { value: "pro", label: "pro" },
                    { value: "enterprise", label: "enterprise" },
                  ]}
                  triggerClassName="w-full border-neutral-700 bg-neutral-800 focus-visible:border-neutral-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-neutral-300">Billing Interval</span>
                  <CustomSelect
                    value={requestedInterval}
                    onValueChange={(value) =>
                      setRequestedInterval(
                        value === "annual" ? "annual" : "monthly",
                      )
                    }
                    options={[
                      { value: "monthly", label: "monthly" },
                      { value: "annual", label: "annual" },
                    ]}
                    triggerClassName="w-full border-neutral-700 bg-neutral-800 focus-visible:border-neutral-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-neutral-300">Seat Count</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    value={requestedSeats}
                    onChange={(event) =>
                      setRequestedSeats(
                        Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1),
                      )
                    }
                    className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCreateCheckout}
                  disabled={isBusy || !canManageBilling}
                  className="rounded-md border border-neutral-600 px-3 py-2 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === "create-checkout" ? "Creating..." : "Create Polar Checkout"}
                </button>

                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={isBusy || !canManageBilling}
                  className="rounded-md border border-neutral-600 px-3 py-2 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === "open-portal" ? "Opening..." : "Open Polar Portal"}
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                Checkout and portal are opened in a new tab so you can keep this test page open.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="mb-4 text-lg font-semibold">Email Delivery Test</h2>

            <form onSubmit={handleSendDebugEmail} className="space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-neutral-300">Recipient</span>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(event) => setEmailRecipient(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="qa@example.com"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-300">Template</span>
                <CustomSelect
                  value={emailTemplate}
                  onValueChange={(value) =>
                    setEmailTemplate(value as DebugEmailTemplate)
                  }
                  options={[
                    { value: "welcome", label: "welcome" },
                    { value: "teamInvite", label: "team invite" },
                    { value: "magicLink", label: "magic link" },
                    { value: "otp", label: "otp" },
                  ]}
                  triggerClassName="w-full border-neutral-700 bg-neutral-800 focus-visible:border-neutral-500"
                />
              </label>

              {emailTemplate === "teamInvite" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-neutral-300">Team Name</span>
                      <input
                        value={inviteTeamName}
                        onChange={(event) => setInviteTeamName(event.target.value)}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                        placeholder="Debug Team"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-neutral-300">Role Name</span>
                      <input
                        value={inviteRoleName}
                        onChange={(event) => setInviteRoleName(event.target.value)}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                        placeholder="member"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-neutral-300">Invite URL (optional)</span>
                    <input
                      value={inviteLink}
                      onChange={(event) => setInviteLink(event.target.value)}
                      className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                      placeholder="https://example.com/invite/token"
                    />
                  </label>
                </>
              )}

              {emailTemplate === "magicLink" && (
                <label className="block space-y-1">
                  <span className="text-neutral-300">Magic Link URL (optional)</span>
                  <input
                    value={magicLinkUrl}
                    onChange={(event) => setMagicLinkUrl(event.target.value)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                    placeholder="https://example.com/auth/callback"
                  />
                </label>
              )}

              {emailTemplate === "otp" && (
                <label className="block space-y-1">
                  <span className="text-neutral-300">OTP Code (optional)</span>
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                    placeholder="482951"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={sendingDebugEmail}
                className="rounded-md border border-neutral-600 px-3 py-2 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingDebugEmail ? "Sending..." : "Send Debug Email"}
              </button>
            </form>

            {debugEmailResult && (
              <div className="mt-4 rounded-md border border-neutral-800 bg-neutral-800/60 p-3 text-xs text-neutral-300">
                <p>
                  Sent to <strong>{debugEmailResult.to}</strong> using <strong>{debugEmailResult.template}</strong>.
                </p>
                <p className="mt-1">Message ID: {debugEmailResult.messageId || "(not provided)"}</p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="mb-4 text-lg font-semibold">Analytics Probe</h2>

            <form onSubmit={handleRunAnalyticsProbe} className="space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-neutral-300">Path</span>
                <input
                  value={analyticsPath}
                  onChange={(event) => setAnalyticsPath(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="/debug"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-300">Visitor ID (optional)</span>
                <input
                  value={analyticsVisitorId}
                  onChange={(event) => setAnalyticsVisitorId(event.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-500"
                  placeholder="debug-visitor-1"
                />
              </label>

              <button
                type="submit"
                disabled={runningAnalyticsProbe}
                className="rounded-md border border-neutral-600 px-3 py-2 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAnalyticsProbe ? "Running..." : "Run Analytics Probe"}
              </button>
            </form>

            {analyticsProbeResult && (
              <div className="mt-4 rounded-md border border-neutral-800 bg-neutral-800/60 p-3 text-xs text-neutral-300">
                <p>
                  Tracked events for <strong>{analyticsProbeResult.path}</strong> with visitor <strong>{analyticsProbeResult.visitorId}</strong>.
                </p>
                <p className="mt-1">
                  Sample metric: {analyticsProbeResult.sampledMetric.name}={" "}
                  {analyticsProbeResult.sampledMetric.value} ({analyticsProbeResult.sampledMetric.rating})
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Overview Snapshot</h2>

          {!overview && (
            <p className="text-sm text-neutral-400">
              No overview loaded yet. Click <strong>Load Overview</strong>.
            </p>
          )}

          {overview && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-3">
                  <p className="text-xs text-neutral-400">Team</p>
                  <p className="font-medium">{overview.teamName}</p>
                  <p className="text-xs text-neutral-500">{overview.teamSlug}</p>
                </div>

                <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-3">
                  <p className="text-xs text-neutral-400">Current Plan</p>
                  <p className="font-medium">
                    {overview.plan} ({overview.billingInterval || "monthly"})
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatMoney(overview.planAmount, "USD")} /{" "}
                    {overview.billingInterval === "annual" ? "year" : "month"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(overview.seatCount || 1)} seat
                    {(overview.seatCount || 1) === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-3">
                  <p className="text-xs text-neutral-400">Provider</p>
                  <p className="font-medium">{overview.payments.provider}</p>
                  <p className="text-xs text-neutral-500">
                    Configured: {String(overview.payments.configured)}
                  </p>
                </div>

                <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-3">
                  <p className="text-xs text-neutral-400">Domain Usage</p>
                  <p className="font-medium">
                    {overview.domainUsage.used} / {overview.domainUsage.total}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {overview.pricing.map((plan) => (
                  <div
                    key={plan.key}
                    className="rounded-md border border-neutral-800 bg-neutral-800/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-neutral-500">{plan.key}</p>
                    <p className="font-medium">{plan.label}</p>
                    <p className="text-neutral-300">
                      Monthly: {formatMoney(plan.monthlyAmount, plan.currency)} total
                    </p>
                    <p className="text-neutral-300">
                      Annual: {formatMoney(plan.annualAmount, plan.currency)} total
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Per seat: {formatMoney(plan.monthlyPerSeat, plan.currency)} / mo •{" "}
                      {formatMoney(plan.annualPerSeat, plan.currency)} / yr
                    </p>
                    <p className="text-xs text-neutral-500">
                      Polar products: monthly={String(plan.hasPolarProductMonthly)} annual={String(
                        plan.hasPolarProductAnnual,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-md border border-neutral-800">
                <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
                  <thead className="bg-neutral-800/70 text-xs uppercase tracking-wide text-neutral-400">
                    <tr>
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {overview.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2 font-mono text-xs">{invoice.id}</td>
                        <td className="px-3 py-2">{invoice.status}</td>
                        <td className="px-3 py-2">
                          {formatMoney(invoice.amount, invoice.currency || "USD")}
                        </td>
                        <td className="px-3 py-2 text-neutral-300">
                          {new Date(invoice.issuedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {overview.invoices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                          No invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Diagnostics Result</h2>
          {!debugReport && <p className="text-sm text-neutral-400">No diagnostics run yet.</p>}

          {debugReport && (
            <div className="space-y-3 text-sm">
              <p className="text-neutral-300">
                Summary: {debugReport.summary.passed}/{debugReport.summary.total} passed, {" "}
                {debugReport.summary.failed} failed.
              </p>

              <div className="space-y-2">
                {debugReport.tests.map((test) => (
                  <div
                    key={test.key}
                    className={`rounded-md border p-3 ${
                      test.passed
                        ? "border-emerald-700/60 bg-emerald-950/20"
                        : "border-red-700/60 bg-red-950/20"
                    }`}
                  >
                    <p className="font-medium">{test.label}</p>
                    <p className="text-xs text-neutral-300">{test.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Last Action Payload</h2>
          <p className="mb-2 text-xs text-neutral-400">
            Action: {lastActionName} | At: {lastActionAt}
          </p>
          <pre className="max-h-90 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200">
            {lastPayload ? JSON.stringify(lastPayload, null, 2) : "No action payload yet."}
          </pre>
        </section>
      </div>
    </div>
  );
}
