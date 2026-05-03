"use client";

import IntegrationModal from "@/components/interface/dashboard/integrations/components/integrationModel";
import IntegrationCard from "@/components/interface/dashboard/integrations/integrationCard";
import {
  createAccessGroup,
  createTeamRole,
  getTeam,
  inviteToTeam,
  removeMember,
  removeTeamRole,
  updateTeamSecuritySettings,
  updateTeamWebhookSettings,
  updateMemberRole,
  updateTeam,
} from "@/actions/teams";
import {
  createDebugInvoice,
  createPolarCheckoutSession,
  createPolarCustomerPortalSession,
  getBillingOverview,
  runBillingDebugTests,
  updateBillingSettings,
} from "@/actions/billing";
import { getExperiments } from "@/actions/experiments";
import type { TeamCapability } from "@/models/Team";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";

type IntegrationStatus = "installed" | "disabled";
type IntegrationId = "cloudflare" | "sentry" | "grafana";
type IntegrationCategory = "networking" | "monitoring" | "observability";
type BuiltinRole = "owner" | "admin" | "billing_manager" | "member" | "viewer";
type InviteRole = Exclude<BuiltinRole, "owner"> | string;
type MemberRole = BuiltinRole | string;
type RoleInheritance = Exclude<BuiltinRole, "owner">;
type AccessDefaultRole = "viewer" | "member" | "admin";
type LastActiveKey = "minutesAgo2" | "minutesAgo15" | "yesterday" | "justInvited";
type SettingsSection =
  | "general"
  | "billing"
  | "invoices"
  | "members"
  | "accessGroups"
  | "webhooks"
  | "securityPrivacy"
  | "appsIntegrations";
type SecurityMessageState =
  | "saved"
  | "enableMethodBeforeSave"
  | "atLeastOneMethodEnabled"
  | null;

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: IntegrationStatus;
  details?: string;
}

interface IntegrationDefinition {
  key: IntegrationId;
  category: IntegrationCategory;
  logo: string;
  status?: IntegrationStatus;
}

interface InvoiceRecord {
  id: string;
  amount: number;
  status: "paid" | "pending" | "draft" | "failed";
  issuedAt: string;
}

type InvoiceStatus = InvoiceRecord["status"];
type BillingInterval = "monthly" | "annual";

interface BillingPlanPricing {
  key: string;
  label: string;
  amount: number;
  monthlyAmount: number;
  annualAmount: number;
  monthlyPerSeat: number;
  annualPerSeat: number;
  currency: string;
  hasPolarProduct: boolean;
  hasPolarProductMonthly: boolean;
  hasPolarProductAnnual: boolean;
}

interface TeamMemberRecord {
  userId?: string;
  name: string;
  email: string;
  role: MemberRole;
  lastActive: LastActiveKey;
}

interface TeamRoleDefinition {
  key: string;
  name: string;
  description: string;
  inherits: BuiltinRole | RoleInheritance;
  permissions: string[];
  isPreset: boolean;
}

interface PendingInviteRecord {
  email: string;
  role: string;
  invitedAt: string;
  expiresAt: string;
}

interface BillingDebugTest {
  key: string;
  label: string;
  passed: boolean;
  details: string;
}

interface BillingDebugReport {
  success: boolean;
  executedAt: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  tests: BillingDebugTest[];
}

interface AccessGroupRecord {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: number;
  defaultRole: AccessDefaultRole;
}

interface SavedWebhookConfig {
  url: string;
  secretMasked: string;
  events: string[];
  updatedAt: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  "general",
  "billing",
  "invoices",
  "members",
  "accessGroups",
  "webhooks",
  "securityPrivacy",
  "appsIntegrations",
];

const integrationDefinitions: IntegrationDefinition[] = [
  {
    key: "cloudflare",
    category: "networking",
    logo: "/integrations/cloudflare.jpeg",
  },
  {
    key: "sentry",
    category: "monitoring",
    logo: "/integrations/sentry.jpeg",
    status: "installed",
  },
  {
    key: "grafana",
    category: "observability",
    logo: "/integrations/grafana.jpeg",
  },
];

function resolveIntlLocale(locale: string) {
  if (locale === "jp") return "ja-JP";
  if (locale === "zh") return "zh-CN";
  if (locale === "tl") return "fil-PH";
  if (locale === "ms") return "ms-MY";
  return locale;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeMemberRole(role: unknown): MemberRole {
  const normalized = String(role ?? "").trim().toLowerCase();

  if (normalized === "owner") return "owner";
  if (normalized === "admin") return "admin";
  if (normalized === "billing_manager") return "billing_manager";
  if (normalized === "viewer") return "viewer";
  if (normalized === "member") return "member";

  if (!normalized) return "member";
  return normalized;
}

function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "pending") return "pending";
  if (normalized === "draft") return "draft";
  return "failed";
}

function normalizeInvoiceDate(value: unknown) {
  const parsed = new Date(String(value ?? ""));
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
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

function lastActiveFromTimestamp(value: unknown): LastActiveKey {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) {
    return "yesterday";
  }

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 1000 * 60 * 5) return "minutesAgo2";
  if (diffMs < 1000 * 60 * 60) return "minutesAgo15";
  return "yesterday";
}

function deriveNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "member";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function maskSecret(secret: string) {
  if (secret.length <= 6) {
    return "*".repeat(secret.length);
  }

  return `${secret.slice(0, 4)}${"*".repeat(secret.length - 6)}${secret.slice(-2)}`;
}

const SEAT_COUNT_MIN = 1;
const SEAT_COUNT_MAX = 1000;
const RETENTION_DAYS_MIN = 7;
const RETENTION_DAYS_MAX = 365;
const RETENTION_DAYS_DEFAULT = 90;

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function clampSeatCount(value: unknown) {
  const parsed = Math.floor(Number(value ?? SEAT_COUNT_MIN) || SEAT_COUNT_MIN);
  return Math.min(SEAT_COUNT_MAX, Math.max(SEAT_COUNT_MIN, parsed));
}

function clampRetentionDays(value: unknown) {
  const parsed = Math.floor(
    Number(value ?? RETENTION_DAYS_DEFAULT) || RETENTION_DAYS_DEFAULT,
  );
  return Math.min(RETENTION_DAYS_MAX, Math.max(RETENTION_DAYS_MIN, parsed));
}

function resolveInviteRoleFallback(roles: TeamRoleDefinition[]): InviteRole {
  const fallbackRole =
    roles.find((role) => role.key === "member") ||
    roles.find((role) => role.key !== "owner");

  return (fallbackRole?.key ?? "member") as InviteRole;
}

function buildWebhookEventList(
  includeIncidentUpdates: boolean,
  includeDomainStatusChanges: boolean,
  includeBillingEvents: boolean,
) {
  return [
    includeIncidentUpdates ? "incident.updated" : null,
    includeDomainStatusChanges ? "domain.status.changed" : null,
    includeBillingEvents ? "billing.updated" : null,
  ].filter((event): event is string => Boolean(event));
}

function normalizeTeamMembers(value: unknown): TeamMemberRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((member: unknown) => {
    const raw = member as {
      userId?: unknown;
      name?: unknown;
      email?: unknown;
      role?: unknown;
      joinedAt?: unknown;
    };

    return {
      userId: typeof raw.userId === "string" ? raw.userId : "",
      name:
        typeof raw.name === "string" && raw.name.length > 0
          ? raw.name
          : deriveNameFromEmail(String(raw.email || "member@example.com")),
      email: typeof raw.email === "string" ? raw.email : "",
      role: normalizeMemberRole(raw.role),
      lastActive: lastActiveFromTimestamp(raw.joinedAt),
    };
  });
}

function normalizePendingInvites(value: unknown): PendingInviteRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((invite: unknown) => {
    const raw = invite as {
      email?: unknown;
      role?: unknown;
      invitedAt?: unknown;
      expiresAt?: unknown;
    };

    return {
      email: String(raw.email || ""),
      role: String(raw.role || "member"),
      invitedAt: String(raw.invitedAt || new Date().toISOString()),
      expiresAt: String(raw.expiresAt || new Date().toISOString()),
    };
  });
}

function normalizeAccessGroups(value: unknown): AccessGroupRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((group: unknown) => {
      const raw = group as {
        id?: unknown;
        name?: unknown;
        description?: unknown;
        members?: unknown;
        permissions?: unknown;
        default_role?: unknown;
      };

      const normalizedName = String(raw.name ?? "").trim();
      if (!normalizedName) return null;

      const normalizedRole =
        raw.default_role === "admin"
          ? "admin"
          : raw.default_role === "member"
            ? "member"
            : "viewer";

      return {
        id:
          typeof raw.id === "string" && raw.id.trim().length > 0
            ? raw.id
            : normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: normalizedName,
        description: String(raw.description ?? ""),
        members: Math.max(0, Math.floor(Number(raw.members ?? 0) || 0)),
        permissions: Math.max(0, Math.floor(Number(raw.permissions ?? 0) || 0)),
        defaultRole: normalizedRole as AccessDefaultRole,
      };
    })
    .filter((group): group is AccessGroupRecord => Boolean(group));
}

function normalizeWebhookEvents(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((event) => String(event ?? "").trim())
    .filter(Boolean);
}

function normalizeRecentInvoices(value: unknown): InvoiceRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((invoice: unknown) => {
      const raw = invoice as {
        id?: unknown;
        amount?: unknown;
        status?: unknown;
        issuedAt?: unknown;
      };

      return {
        id: String(raw.id ?? ""),
        amount: Number(raw.amount ?? 0),
        status: normalizeInvoiceStatus(raw.status),
        issuedAt: normalizeInvoiceDate(raw.issuedAt),
      };
    })
    .filter((invoice) => invoice.id.length > 0);
}

function toDisplayLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

export default function SettingsPage() {
  const t = useTranslations("DashboardPages.settings");
  const integrationsT = useTranslations("DashboardPages.integrations");
  const locale = useLocale();
  const intlLocale = useMemo(() => resolveIntlLocale(locale), [locale]);

  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamSlug, setTeamSlug] = useState<string | null>(null);
  const [name, setName] = useState("Netgoat");
  const [billingEmail, setBillingEmail] = useState("billing@netgoat.io");
  const [autoRecharge, setAutoRecharge] = useState(true);
  const [invoiceEmail, setInvoiceEmail] = useState("finance@netgoat.io");
  const [poNumber, setPoNumber] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRecord[]>([]);
  const [roleOptions, setRoleOptions] = useState<TeamRoleDefinition[]>([]);
  const [currentUserCapabilities, setCurrentUserCapabilities] = useState<string[]>([]);
  const [defaultAccess, setDefaultAccess] = useState<AccessDefaultRole>("viewer");
  const [domainsUsed, setDomainsUsed] = useState(0);
  const [totalDomains, setTotalDomains] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("pro");
  const [currentPlanCost, setCurrentPlanCost] = useState(0);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [seatCount, setSeatCount] = useState(1);
  const [pricingPlans, setPricingPlans] = useState<BillingPlanPricing[]>([]);
  const [polarConfigured, setPolarConfigured] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRecord[]>([]);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [canManageInvoices, setCanManageInvoices] = useState(false);
  const [startingCheckoutPlan, setStartingCheckoutPlan] = useState<string | null>(null);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
  const [loadingServerData, setLoadingServerData] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [savingInvoices, setSavingInvoices] = useState(false);
  const [invitingMember, setInvitingMember] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [deletingRoleKey, setDeletingRoleKey] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleInherits, setNewRoleInherits] =
    useState<RoleInheritance>("member");
  const [newRoleCapabilities, setNewRoleCapabilities] =
    useState<TeamCapability[]>([]);
  const [billingDebugReport, setBillingDebugReport] =
    useState<BillingDebugReport | null>(null);
  const [runningBillingDebug, setRunningBillingDebug] = useState(false);
  const [creatingDebugInvoice, setCreatingDebugInvoice] = useState(false);
  const [developerModeTestingEnabled, setDeveloperModeTestingEnabled] =
    useState(false);
  const [groups, setGroups] = useState<AccessGroupRecord[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [savingAccessGroup, setSavingAccessGroup] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [notifyOnIncidents, setNotifyOnIncidents] = useState(true);
  const [notifyOnDomains, setNotifyOnDomains] = useState(true);
  const [notifyOnBilling, setNotifyOnBilling] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState<SavedWebhookConfig | null>(
    null,
  );
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [sendingWebhookTest, setSendingWebhookTest] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [allowMagicLink, setAllowMagicLink] = useState(true);
  const [allowEmailCode, setAllowEmailCode] = useState(true);
  const [retentionDays, setRetentionDays] = useState("90");
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] =
    useState<SecurityMessageState>(null);

  const localizedIntegrations = useMemo(
    () =>
      integrationDefinitions.map((integration) => ({
        name: integrationsT(`items.${integration.key}.name`),
        category: integrationsT(`categories.${integration.category}`),
        description: integrationsT(`items.${integration.key}.description`),
        details: integrationsT(`items.${integration.key}.details`),
        logo: integration.logo,
        status: integration.status,
      })),
    [integrationsT],
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    [intlLocale],
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "short",
        year: "numeric",
      }),
    [intlLocale],
  );

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    [intlLocale],
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [intlLocale],
  );

  const normalizedSearchTerm = useMemo(
    () => searchTerm.trim().toLowerCase(),
    [searchTerm],
  );

  const filteredIntegrations = useMemo(() => {
    if (!normalizedSearchTerm) {
      return localizedIntegrations;
    }

    return localizedIntegrations.filter((integration) => {
      return (
        integration.name.toLowerCase().includes(normalizedSearchTerm) ||
        integration.description.toLowerCase().includes(normalizedSearchTerm)
      );
    });
  }, [localizedIntegrations, normalizedSearchTerm]);

  const roleNameMap = useMemo(
    () =>
      new Map(
        roleOptions.map((role) => [
          role.key,
          role.name,
        ]),
      ),
    [roleOptions],
  );

  const roleLabel = (role: MemberRole) => {
    const explicitName = roleNameMap.get(role);
    if (explicitName) return explicitName;
    if (role === "owner") return t("members.roles.owner");
    if (role === "admin") return t("members.roles.admin");
    if (role === "billing_manager") return t("members.roles.billingManager");
    if (role === "member") return t("members.roles.member");
    if (role === "viewer") return t("members.roles.viewer");

    return role
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  };

  const memberAssignableRoles = useMemo(
    () => roleOptions.filter((role) => role.key !== "owner"),
    [roleOptions],
  );

  const customRoles = useMemo(
    () => roleOptions.filter((role) => !role.isPreset),
    [roleOptions],
  );

  const memberEmailSet = useMemo(
    () =>
      new Set(
        members
          .map((member) => member.email.trim().toLowerCase())
          .filter(Boolean),
      ),
    [members],
  );

  const accessGroupNameSet = useMemo(
    () =>
      new Set(
        groups
          .map((group) => group.name.trim().toLowerCase())
          .filter(Boolean),
      ),
    [groups],
  );

  const selectedWebhookEvents = useMemo(
    () => buildWebhookEventList(notifyOnIncidents, notifyOnDomains, notifyOnBilling),
    [notifyOnIncidents, notifyOnDomains, notifyOnBilling],
  );

  const currentPlanLabel = useMemo(
    () => toDisplayLabel(currentPlan),
    [currentPlan],
  );

  const domainUsagePercent = useMemo(() => {
    if (totalDomains <= 0) return 0;
    return Math.min(100, Math.round((domainsUsed / totalDomains) * 100));
  }, [domainsUsed, totalDomains]);

  const paidPricingPlans = useMemo(
    () =>
      pricingPlans
        .filter(
          (plan) =>
            (billingInterval === "annual"
              ? plan.hasPolarProductAnnual
              : plan.hasPolarProductMonthly),
        )
        .sort((a, b) => {
          const left = billingInterval === "annual" ? a.annualAmount : a.monthlyAmount;
          const right = billingInterval === "annual" ? b.annualAmount : b.monthlyAmount;
          return left - right;
        }),
    [pricingPlans, billingInterval],
  );

  const canManageMembers = useMemo(
    () =>
      currentUserCapabilities.includes("*") ||
      currentUserCapabilities.includes("members.invite") ||
      currentUserCapabilities.includes("members.role.update") ||
      currentUserCapabilities.includes("members.remove") ||
      currentUserCapabilities.includes("roles.manage"),
    [currentUserCapabilities],
  );

  const canManageRoles = useMemo(
    () =>
      currentUserCapabilities.includes("*") ||
      currentUserCapabilities.includes("roles.manage"),
    [currentUserCapabilities],
  );

  const canManageAccessGroups = useMemo(
    () =>
      currentUserCapabilities.includes("*") ||
      currentUserCapabilities.includes("team.settings.update"),
    [currentUserCapabilities],
  );

  const canManageWebhooks = useMemo(
    () =>
      currentUserCapabilities.includes("*") ||
      currentUserCapabilities.includes("integrations.manage") ||
      currentUserCapabilities.includes("security.manage") ||
      currentUserCapabilities.includes("team.settings.update"),
    [currentUserCapabilities],
  );

  const canManageSecurity = useMemo(
    () =>
      currentUserCapabilities.includes("*") ||
      currentUserCapabilities.includes("security.manage") ||
      currentUserCapabilities.includes("team.settings.update"),
    [currentUserCapabilities],
  );

  const roleCapabilityOptions = useMemo<Array<{ key: TeamCapability; label: string }>>(
    () => [
      {
        key: "members.invite",
        label: t("members.capabilities.inviteMembers"),
      },
      {
        key: "members.role.update",
        label: t("members.capabilities.manageMemberRoles"),
      },
      {
        key: "members.remove",
        label: t("members.capabilities.removeMembers"),
      },
      {
        key: "billing.manage",
        label: t("members.capabilities.manageBilling"),
      },
      {
        key: "invoices.manage",
        label: t("members.capabilities.manageInvoices"),
      },
      {
        key: "domains.manage",
        label: t("members.capabilities.manageDomains"),
      },
      {
        key: "integrations.manage",
        label: t("members.capabilities.manageIntegrations"),
      },
      {
        key: "security.manage",
        label: t("members.capabilities.manageSecurity"),
      },
    ],
    [t],
  );

  const lastActiveLabel = (value: LastActiveKey) =>
    t(`members.lastActive.${value}`);

  const webhookEventLabel = (event: string) => {
    if (event === "incident.updated") return t("webhooks.events.incidentUpdates");
    if (event === "domain.status.changed") {
      return t("webhooks.events.domainStatusChanges");
    }
    if (event === "billing.updated") return t("webhooks.events.billingEvents");
    return event;
  };

  async function hydrateServerSettings(
    slug: string = "@me",
    options?: { includeBilling?: boolean },
  ) {
    const { includeBilling = true } = options ?? {};
    const teamData = await getTeam(slug);
    const teamRecord = asRecord(teamData);

    const resolvedTeamSlug =
      typeof teamRecord?.slug === "string" && teamRecord.slug.length > 0
        ? teamRecord.slug
        : slug;

    setTeamSlug(resolvedTeamSlug);

    if (typeof teamRecord?.name === "string" && teamRecord.name.length > 0) {
      setName(teamRecord.name);
    }

    const normalizedRoles = Array.isArray(teamRecord?.roles)
      ? (teamRecord.roles as TeamRoleDefinition[])
      : [];
    setRoleOptions(normalizedRoles);

    if (!normalizedRoles.some((role) => role.key === inviteRole)) {
      setInviteRole(resolveInviteRoleFallback(normalizedRoles));
    }

    setMembers(normalizeTeamMembers(teamRecord?.membersDetailed));
    setPendingInvites(normalizePendingInvites(teamRecord?.pendingInvites));
    setCurrentUserCapabilities(
      Array.isArray(teamRecord?.currentUserCapabilities)
        ? teamRecord.currentUserCapabilities.map((capability) =>
            String(capability ?? ""),
          )
        : [],
    );

    const teamSettings = asRecord(teamRecord?.settings);
    const normalizedGroups = normalizeAccessGroups(teamSettings?.access_groups);
    setGroups(normalizedGroups);
    setDefaultAccess(
      normalizedGroups.length > 0 ? normalizedGroups[0].defaultRole : "viewer",
    );

    const webhookSettings = asRecord(teamSettings?.webhooks);
    const webhookEndpoint = String(webhookSettings?.endpoint_url ?? "").trim();
    const webhookEvents = normalizeWebhookEvents(webhookSettings?.events);

    setWebhookUrl(webhookEndpoint);
    setWebhookSecret("");
    setNotifyOnIncidents(webhookEvents.includes("incident.updated"));
    setNotifyOnDomains(webhookEvents.includes("domain.status.changed"));
    setNotifyOnBilling(webhookEvents.includes("billing.updated"));

    if (webhookEndpoint.length > 0) {
      const updatedAtCandidate = new Date(String(webhookSettings?.updated_at ?? ""));
      setSavedWebhook({
        url: webhookEndpoint,
        secretMasked:
          typeof webhookSettings?.signing_secret_masked === "string"
            ? webhookSettings.signing_secret_masked
            : "********",
        events: webhookEvents,
        updatedAt: dateTimeFormatter.format(
          Number.isNaN(updatedAtCandidate.getTime())
            ? new Date()
            : updatedAtCandidate,
        ),
      });
    } else {
      setSavedWebhook(null);
    }

    setRequire2FA(teamSettings?.require_2fa === true);

    const authMethods = asRecord(teamSettings?.auth_methods);
    const normalizedMagicLink =
      typeof authMethods?.magic_link === "boolean"
        ? authMethods.magic_link
        : true;
    const normalizedEmailCode =
      typeof authMethods?.email_code === "boolean"
        ? authMethods.email_code
        : true;

    if (!normalizedMagicLink && !normalizedEmailCode) {
      setAllowMagicLink(true);
      setAllowEmailCode(true);
    } else {
      setAllowMagicLink(normalizedMagicLink);
      setAllowEmailCode(normalizedEmailCode);
    }

    setRetentionDays(String(clampRetentionDays(teamSettings?.retention_days)));
    setSecurityMessage(null);

    if (!includeBilling) {
      return resolvedTeamSlug;
    }

    const billing = await getBillingOverview(resolvedTeamSlug);
    if (typeof billing?.plan === "string") {
      setCurrentPlan(billing.plan);
    }
    setDomainsUsed(Number(billing?.domainUsage?.used || 0));
    setTotalDomains(Number(billing?.domainUsage?.total || 0));
    setCurrentPlanCost(Number(billing?.planAmount || 0));
    setBillingInterval(
      billing?.billingInterval === "annual" ? "annual" : "monthly",
    );
    setSeatCount(clampSeatCount(billing?.seatCount));
    setPricingPlans(
      Array.isArray(billing?.pricing)
        ? (billing.pricing as BillingPlanPricing[])
        : [],
    );
    setPolarConfigured(Boolean(billing?.payments?.configured));
    setRecentInvoices(normalizeRecentInvoices(billing?.invoices));

    if (typeof billing?.billingEmail === "string") {
      setBillingEmail(billing.billingEmail);
    }
    if (typeof billing?.invoiceEmail === "string") {
      setInvoiceEmail(billing.invoiceEmail);
    }
    if (typeof billing?.poNumber === "string") {
      setPoNumber(billing.poNumber);
    }
    if (typeof billing?.autoRecharge === "boolean") {
      setAutoRecharge(billing.autoRecharge);
    }

    setCanManageBilling(Boolean(billing?.permissions?.canManageBilling));
    setCanManageInvoices(Boolean(billing?.permissions?.canManageInvoices));

    return resolvedTeamSlug;
  }

  useEffect(() => {
    let cancelled = false;

    const loadServerState = async () => {
      try {
        setLoadingServerData(true);
        const [, flags] = await Promise.all([
          hydrateServerSettings("@me"),
          getExperiments().catch(() => null),
        ]);

        if (!cancelled) {
          setDeveloperModeTestingEnabled(
            isDeveloperModeTestingEnabled(
              flags as Record<string, boolean | string> | null | undefined,
            ),
          );
        }
      } catch (error: unknown) {
        console.error("Failed to load server settings", error);
        if (!cancelled) {
          toast.error(getErrorMessage(error, t("toasts.settingsLoadFailed")));
        }
      } finally {
        if (!cancelled) {
          setLoadingServerData(false);
        }
      }
    };

    loadServerState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();

    const normalizedName = name.trim();
    if (!normalizedName) {
      toast.error(t("toasts.teamNameEmpty"));
      return;
    }

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setSavingGeneral(true);
      await updateTeam(teamSlug, { name: normalizedName.slice(0, 32) });
      await hydrateServerSettings(teamSlug, { includeBilling: false });
      toast.success(t("toasts.teamNameSaved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.teamNameSaveFailed")));
    } finally {
      setSavingGeneral(false);
    }
  }

  async function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();

    const normalizedEmail = billingEmail.trim().toLowerCase();
    const normalizedSeats = clampSeatCount(seatCount);

    if (!isValidEmail(normalizedEmail)) {
      toast.error(t("toasts.billingEmailInvalid"));
      return;
    }

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setSavingBilling(true);
      await updateBillingSettings(teamSlug, {
        billingEmail: normalizedEmail,
        autoRecharge,
        billingInterval,
        seatCount: normalizedSeats,
      });
      setBillingEmail(normalizedEmail);
      setSeatCount(normalizedSeats);
      toast.success(t("toasts.billingSaved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.billingSaveFailed")));
    } finally {
      setSavingBilling(false);
    }
  }

  async function handleSaveInvoicePreferences(e: React.FormEvent) {
    e.preventDefault();

    const normalizedEmail = invoiceEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast.error(t("toasts.invoiceEmailInvalid"));
      return;
    }

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setSavingInvoices(true);
      await updateBillingSettings(teamSlug, {
        invoiceEmail: normalizedEmail,
        poNumber: poNumber.trim(),
      });
      setInvoiceEmail(normalizedEmail);
      setPoNumber(poNumber.trim());
      toast.success(t("toasts.invoiceSaved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.invoiceSaveFailed")));
    } finally {
      setSavingInvoices(false);
    }
  }

  function handleDownloadInvoice(invoice: InvoiceRecord) {
    const issuedDate = new Date(invoice.issuedAt);
    const issuedOn = dayFormatter.format(issuedDate);
    const period = monthFormatter.format(issuedDate);

    const content = [
      t("invoices.downloadContent.invoiceId", { id: invoice.id }),
      t("invoices.downloadContent.period", { period }),
      t("invoices.downloadContent.amount", {
        amount: currencyFormatter.format(invoice.amount),
      }),
      t("invoices.downloadContent.status", {
        status: t(`invoices.status.${invoice.status}`),
      }),
      t("invoices.downloadContent.issuedOn", { issuedOn }),
      t("invoices.downloadContent.recipient", { recipient: invoiceEmail }),
      t("invoices.downloadContent.poNumber", {
        value: poNumber || t("common.notAvailable"),
      }),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast.success(t("toasts.invoiceDownloaded", { id: invoice.id }));
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast.error(t("toasts.memberEmailInvalid"));
      return;
    }

    if (memberEmailSet.has(normalizedEmail)) {
      toast.error(t("toasts.memberExists"));
      return;
    }

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setInvitingMember(true);
      await inviteToTeam(teamSlug, normalizedEmail, inviteRole);
      await hydrateServerSettings(teamSlug, { includeBilling: false });
      setInviteEmail("");
      setInviteRole(resolveInviteRoleFallback(roleOptions));
      toast.success(t("toasts.invitationSent"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.invitationFailed")));
    } finally {
      setInvitingMember(false);
    }
  }

  async function handleMemberRoleUpdate(member: TeamMemberRecord, nextRole: string) {
    if (!teamSlug || !member.userId) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setUpdatingMemberId(member.userId);
      await updateMemberRole(teamSlug, member.userId, nextRole);
      await hydrateServerSettings(teamSlug, { includeBilling: false });
      toast.success(t("toasts.memberRoleUpdated"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.memberRoleUpdateFailed")));
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemoveTeamMember(member: TeamMemberRecord) {
    if (!teamSlug || !member.userId) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setRemovingMemberId(member.userId);
      await removeMember(teamSlug, member.userId);
      await hydrateServerSettings(teamSlug, { includeBilling: false });
      toast.success(t("toasts.memberRemoved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.memberRemoveFailed")));
    } finally {
      setRemovingMemberId(null);
    }
  }

  function toggleRoleCapability(capabilityKey: TeamCapability) {
    setNewRoleCapabilities((previous) =>
      previous.includes(capabilityKey)
        ? previous.filter((item) => item !== capabilityKey)
        : [...previous, capabilityKey],
    );
  }

  async function handleCreateCustomRole(e: React.FormEvent) {
    e.preventDefault();

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    const normalizedName = newRoleName.trim();
    if (!normalizedName) {
      toast.error(t("toasts.roleNameRequired"));
      return;
    }

    try {
      setCreatingRole(true);
      const result = await createTeamRole(teamSlug, {
        name: normalizedName,
        description: newRoleDescription.trim() || undefined,
        inherits: newRoleInherits,
        permissions: newRoleCapabilities,
      });

      if (Array.isArray(result?.roles)) {
        setRoleOptions(result.roles as TeamRoleDefinition[]);
      }

      setNewRoleName("");
      setNewRoleDescription("");
      setNewRoleInherits("member");
      setNewRoleCapabilities([]);
      toast.success(t("toasts.roleCreated"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.roleCreateFailed")));
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleDeleteCustomRole(roleKey: string) {
    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setDeletingRoleKey(roleKey);
      const result = await removeTeamRole(teamSlug, roleKey);
      if (Array.isArray(result?.roles)) {
        setRoleOptions(result.roles as TeamRoleDefinition[]);
      }
      toast.success(t("toasts.roleRemoved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.roleRemoveFailed")));
    } finally {
      setDeletingRoleKey(null);
    }
  }

  async function handleRunBillingDebug() {
    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setRunningBillingDebug(true);
      const report = await runBillingDebugTests(teamSlug);
      setBillingDebugReport(report as BillingDebugReport);
      toast.success(
        report?.success
          ? t("toasts.billingDebugPassed")
          : t("toasts.billingDebugNeedsAttention"),
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.billingDebugFailed")));
    } finally {
      setRunningBillingDebug(false);
    }
  }

  async function handleCreateBillingDebugInvoice() {
    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setCreatingDebugInvoice(true);
      await createDebugInvoice(teamSlug);
      await hydrateServerSettings(teamSlug);
      toast.success(t("toasts.debugInvoiceCreated"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toasts.debugInvoiceCreateFailed")));
    } finally {
      setCreatingDebugInvoice(false);
    }
  }

  async function handleStartPolarCheckout(planKey: string) {
    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      const normalizedSeats = clampSeatCount(seatCount);

      setSeatCount(normalizedSeats);
      setStartingCheckoutPlan(planKey);
      const response = await createPolarCheckoutSession(
        teamSlug,
        planKey,
        billingInterval,
        normalizedSeats,
      );
      const checkoutUrl = String(response?.checkoutUrl || "");

      if (!checkoutUrl) {
        throw new Error("Polar checkout URL was not returned.");
      }

      window.location.assign(checkoutUrl);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to start Polar checkout."));
    } finally {
      setStartingCheckoutPlan(null);
    }
  }

  async function handleOpenPolarPortal() {
    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    try {
      setOpeningBillingPortal(true);
      const response = await createPolarCustomerPortalSession(teamSlug);
      const portalUrl = String(response?.customerPortalUrl || "");

      if (!portalUrl) {
        throw new Error("Polar customer portal URL was not returned.");
      }

      window.location.assign(portalUrl);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to open Polar billing portal for this team."),
      );
    } finally {
      setOpeningBillingPortal(false);
    }
  }

  async function handleCreateAccessGroup() {
    const normalizedName = newGroupName.trim();
    if (!normalizedName) {
      toast.error(t("toasts.accessGroupNameRequired"));
      return;
    }

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    if (accessGroupNameSet.has(normalizedName.toLowerCase())) {
      toast.error(t("toasts.accessGroupExists"));
      return;
    }

    try {
      setSavingAccessGroup(true);
      await createAccessGroup(teamSlug, {
        name: normalizedName,
        description: newGroupDescription.trim(),
        defaultRole: defaultAccess,
      });
      await hydrateServerSettings(teamSlug, { includeBilling: false });
      setNewGroupName("");
      setNewGroupDescription("");
      toast.success(t("toasts.accessGroupCreated"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create access group."));
    } finally {
      setSavingAccessGroup(false);
    }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    const normalizedUrl = webhookUrl.trim();
    const normalizedSecret = webhookSecret.trim();
    if (!isValidHttpUrl(normalizedUrl)) {
      toast.error(t("toasts.webhookUrlInvalid"));
      return;
    }
    if (normalizedSecret.length < 8) {
      toast.error(t("toasts.webhookSecretTooShort"));
      return;
    }

    const selectedEvents = selectedWebhookEvents;

    if (selectedEvents.length === 0) {
      toast.error(t("toasts.webhookEventRequired"));
      return;
    }

    try {
      setSavingWebhook(true);
      const response = await updateTeamWebhookSettings(teamSlug, {
        url: normalizedUrl,
        secret: normalizedSecret,
        events: selectedEvents,
      });

      const saved = response?.webhook as
        | {
            url?: unknown;
            secretMasked?: unknown;
            events?: unknown;
            updatedAt?: unknown;
          }
        | undefined;

      setWebhookUrl(normalizedUrl);
      setWebhookSecret("");
      setSavedWebhook({
        url: String(saved?.url ?? normalizedUrl),
        secretMasked: String(saved?.secretMasked ?? maskSecret(normalizedSecret)),
        events: Array.isArray(saved?.events)
          ? saved.events.map((event) => String(event ?? "")).filter(Boolean)
          : selectedEvents,
        updatedAt:
          typeof saved?.updatedAt === "string"
            ? dateTimeFormatter.format(new Date(saved.updatedAt))
            : dateTimeFormatter.format(new Date()),
      });
      toast.success(t("toasts.webhookSaved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to save webhook settings."));
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleSendWebhookTest() {
    const normalizedUrl = webhookUrl.trim() || savedWebhook?.url || "";
    if (!isValidHttpUrl(normalizedUrl)) {
      toast.error(t("toasts.webhookInvalidBeforeTest"));
      return;
    }

    const payload = {
      id: `evt_${Date.now()}`,
      type: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        source: "account-settings",
        status: "ok",
      },
    };

    try {
      setSendingWebhookTest(true);
      const response = await fetch(normalizedUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-netgoat-signature": "test-signature",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error(
          t("toasts.webhookTestFailedStatus", {
            status: response.status,
          }),
        );
        return;
      }

      toast.success(t("toasts.webhookTestSent"));
    } catch (error) {
      console.error("Webhook test failed", error);
      toast.error(t("toasts.webhookTestFailed"));
    } finally {
      setSendingWebhookTest(false);
    }
  }

  async function handleSaveSecuritySettings(e: React.FormEvent) {
    e.preventDefault();

    if (!teamSlug) {
      toast.error(t("toasts.teamUnavailable"));
      return;
    }

    if (!allowMagicLink && !allowEmailCode) {
      setSecurityMessage("enableMethodBeforeSave");
      toast.error(t("toasts.securityMethodRequired"));
      return;
    }

    const normalizedDays = clampRetentionDays(retentionDays);

    try {
      setSavingSecurity(true);
      await updateTeamSecuritySettings(teamSlug, {
        require2FA,
        allowMagicLink,
        allowEmailCode,
        retentionDays: normalizedDays,
      });
      setRetentionDays(String(normalizedDays));
      setSecurityMessage("saved");
      toast.success(t("toasts.securitySaved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to save security settings."));
    } finally {
      setSavingSecurity(false);
    }
  }

  function toggleMagicLink(checked: boolean) {
    if (!checked && !allowEmailCode) {
      setSecurityMessage("atLeastOneMethodEnabled");
      return;
    }

    setAllowMagicLink(checked);
    setSecurityMessage(null);
  }

  function toggleEmailCode(checked: boolean) {
    if (!checked && !allowMagicLink) {
      setSecurityMessage("atLeastOneMethodEnabled");
      return;
    }

    setAllowEmailCode(checked);
    setSecurityMessage(null);
  }

  return (
    <div className="min-h-svh bg-neutral-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("title")}
          </h1>
          <p className="text-neutral-400 mt-2">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`relative w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                    activeSection === section
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50"
                  }`}
                >
                  {activeSection === section && (
                    <motion.div
                      layoutId="settings-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full"
                    />
                  )}
                  <span className="ml-2">{t(`sections.${section}`)}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 mx-12">
            {activeSection === "general" && (
              <div className="mx-auto p-6">
                <form onSubmit={handleSaveGeneral}>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden transition-all hover:border-neutral-700">
                    <div className="p-6">
                      <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                        {t("general.teamNameTitle")}
                      </h4>

                      <p className="text-[14px] leading-6 text-neutral-400 mt-2 mb-4">
                        {t("general.teamNameDescription")}
                      </p>

                      <div className="relative max-w-sm">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={32}
                          spellCheck="false"
                          autoComplete="off"
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>
                    </div>

                    <footer className="bg-neutral-800/70 border-t border-neutral-700/65 px-6 py-3 flex items-center justify-between">
                      <div className="text-[13px] text-neutral-500">
                        {t("general.teamNameHint")}
                      </div>

                      <button
                        type="submit"
                        disabled={savingGeneral || loadingServerData}
                        className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                      >
                        {t("actions.save")}
                      </button>
                    </footer>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="space-y-6 p-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-neutral-800">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("billing.planAndUsage.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      {t("billing.planAndUsage.description")}
                    </p>
                  </div>

                  <div className="p-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {t("billing.planAndUsage.currentPlanLabel")}
                      </p>
                      <p className="text-lg font-semibold text-white mt-2">
                        {currentPlanLabel}
                      </p>
                      <p className="text-sm text-neutral-400 mt-1">
                        {`${currencyFormatter.format(currentPlanCost)} / ${
                          billingInterval === "annual" ? "year" : "month"
                        }`}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {`${seatCount} seat${seatCount === 1 ? "" : "s"} at ${currencyFormatter.format(
                          seatCount > 0 ? currentPlanCost / seatCount : 0,
                        )} per seat`}
                      </p>
                    </div>

                    <div className="rounded-md border border-neutral-800 bg-neutral-800/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {t("billing.planAndUsage.domainUsageLabel")}
                      </p>
                      <div className="h-2 mt-3 rounded-full bg-neutral-700 overflow-hidden">
                        <div
                          className="h-full bg-white"
                          style={{
                            width: `${domainUsagePercent}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-neutral-400 mt-2">
                        {t("billing.planAndUsage.domainUsageValue", {
                          used: domainsUsed,
                          total: totalDomains,
                        })}
                      </p>
                    </div>
                  </div>
                </section>

                <form
                  onSubmit={handleSaveBilling}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
                >
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm text-neutral-300 mb-2">
                        {t("billing.form.billingContactEmail")}
                      </label>
                      <input
                        type="email"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        disabled={!canManageBilling || savingBilling || loadingServerData}
                        className="w-full max-w-md bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          Billing interval
                        </label>
                        <CustomSelect
                          value={billingInterval}
                          onValueChange={(value) =>
                            setBillingInterval(
                              value === "annual" ? "annual" : "monthly",
                            )
                          }
                          disabled={!canManageBilling || savingBilling || loadingServerData}
                          options={[
                            { value: "monthly", label: "Monthly" },
                            { value: "annual", label: "Annual" },
                          ]}
                          triggerClassName="w-full bg-neutral-800 border-neutral-700 text-sm text-white focus-visible:border-neutral-600 focus-visible:ring-neutral-600/40"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          Seats
                        </label>
                        <input
                          type="number"
                          min={SEAT_COUNT_MIN}
                          max={SEAT_COUNT_MAX}
                          step={1}
                          value={seatCount}
                          onChange={(e) => setSeatCount(clampSeatCount(e.target.value))}
                          disabled={!canManageBilling || savingBilling || loadingServerData}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>
                    </div>

                    <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/40 px-4 py-3">
                      <span className="text-sm text-neutral-300">
                        {t("billing.form.autoRecharge")}
                      </span>
                      <input
                        type="checkbox"
                        checked={autoRecharge}
                        onChange={(e) => setAutoRecharge(e.target.checked)}
                        disabled={!canManageBilling || savingBilling || loadingServerData}
                        className="h-4 w-4 accent-white"
                      />
                    </label>
                  </div>

                  <footer className="bg-neutral-800/70 border-t border-neutral-700/65 px-6 py-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!canManageBilling || savingBilling || loadingServerData}
                      className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                    >
                      {t("billing.actions.save")}
                    </button>
                  </footer>
                </form>

                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden p-6 space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      Polar Payments
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      Use Polar.sh for subscriptions and payment method management.
                    </p>
                  </div>

                  {!polarConfigured && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      Polar is not fully configured yet. Set POLAR_ACCESS_TOKEN and plan
                      product IDs in your environment.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {paidPricingPlans.map((plan) => {
                      const isCurrentPlan = currentPlan === plan.key;
                      const isLoading = startingCheckoutPlan === plan.key;
                      const planAmount =
                        billingInterval === "annual" ? plan.annualAmount : plan.monthlyAmount;
                      const perSeatAmount =
                        billingInterval === "annual"
                          ? plan.annualPerSeat
                          : plan.monthlyPerSeat;
                      const intervalSuffix = billingInterval === "annual" ? "yr" : "mo";

                      return (
                        <button
                          key={plan.key}
                          type="button"
                          onClick={() => handleStartPolarCheckout(plan.key)}
                          disabled={
                            !polarConfigured ||
                            !canManageBilling ||
                            loadingServerData ||
                            isLoading
                          }
                          className="border border-neutral-700 text-neutral-200 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-800 transition-all disabled:opacity-60"
                        >
                          {isLoading
                            ? `Starting ${plan.label} checkout...`
                            : isCurrentPlan
                              ? `Change ${plan.label} (${currencyFormatter.format(
                                  planAmount,
                                )}/${intervalSuffix}, ${currencyFormatter.format(
                                  perSeatAmount,
                                )} per seat)`
                              : `Choose ${plan.label} (${currencyFormatter.format(
                                  planAmount,
                                )}/${intervalSuffix}, ${currencyFormatter.format(
                                  perSeatAmount,
                                )} per seat)`}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleOpenPolarPortal}
                      disabled={
                        !polarConfigured ||
                        !canManageBilling ||
                        loadingServerData ||
                        openingBillingPortal
                      }
                      className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 transition-all disabled:opacity-60"
                    >
                      {openingBillingPortal
                        ? "Opening Polar portal..."
                        : "Manage Billing in Polar"}
                    </button>
                  </div>
                </section>

                {developerModeTestingEnabled && (
                  <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden p-6 space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                        {t("billing.debug.title")}
                      </h4>
                      <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                        {t("billing.debug.description")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleRunBillingDebug}
                        disabled={!canManageBilling || runningBillingDebug || loadingServerData}
                        className="border border-neutral-700 text-neutral-200 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-800 transition-all"
                      >
                        {runningBillingDebug
                          ? t("billing.debug.actions.running")
                          : t("billing.debug.actions.run")}
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateBillingDebugInvoice}
                        disabled={!canManageInvoices || creatingDebugInvoice || loadingServerData}
                        className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 transition-all"
                      >
                        {creatingDebugInvoice
                          ? t("billing.debug.actions.creating")
                          : t("billing.debug.actions.createTestInvoice")}
                      </button>

                      <Link
                        href="/account/debug"
                        className="border border-neutral-700 text-neutral-200 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-800 transition-all"
                      >
                        Open Debug Route
                      </Link>
                    </div>

                    {billingDebugReport && (
                      <div className="rounded-md border border-neutral-800 bg-neutral-800/30 p-4 space-y-3">
                        <p className="text-sm text-neutral-300">
                          {t("billing.debug.summary", {
                            passed: billingDebugReport.summary.passed,
                            total: billingDebugReport.summary.total,
                          })}
                        </p>

                        <div className="space-y-2">
                          {billingDebugReport.tests.map((test) => (
                            <div
                              key={test.key}
                              className="rounded border border-neutral-700 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-neutral-200">{test.label}</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full border ${
                                    test.passed
                                      ? "border-emerald-500/40 text-emerald-300"
                                      : "border-rose-500/40 text-rose-300"
                                  }`}
                                >
                                  {test.passed
                                    ? t("billing.debug.status.pass")
                                    : t("billing.debug.status.fail")}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">{test.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {activeSection === "invoices" && (
              <div className="space-y-6 p-6">
                <form
                  onSubmit={handleSaveInvoicePreferences}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("invoices.preferences.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2 mb-5">
                      {t("invoices.preferences.description")}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          {t("invoices.preferences.invoiceRecipientEmail")}
                        </label>
                        <input
                          type="email"
                          value={invoiceEmail}
                          onChange={(e) => setInvoiceEmail(e.target.value)}
                          disabled={!canManageBilling || savingInvoices || loadingServerData}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          {t("invoices.preferences.poNumber")}
                        </label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          disabled={!canManageBilling || savingInvoices || loadingServerData}
                          placeholder={t("placeholders.optional")}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <footer className="bg-neutral-800/70 border-t border-neutral-700/65 px-6 py-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!canManageBilling || savingInvoices || loadingServerData}
                      className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                    >
                      {t("invoices.actions.savePreferences")}
                    </button>
                  </footer>
                </form>

                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-neutral-800">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("invoices.recent.title")}
                    </h4>
                  </div>

                  <div className="divide-y divide-neutral-800">
                    {recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{invoice.id}</p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {t("invoices.recent.issued", {
                              period: monthFormatter.format(new Date(invoice.issuedAt)),
                              issuedOn: dayFormatter.format(new Date(invoice.issuedAt)),
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-neutral-200">
                            {currencyFormatter.format(invoice.amount)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              invoice.status === "paid"
                                ? "border-emerald-500/40 text-emerald-300"
                                : invoice.status === "pending"
                                  ? "border-amber-500/40 text-amber-300"
                                  : invoice.status === "draft"
                                    ? "border-sky-500/40 text-sky-300"
                                    : "border-rose-500/40 text-rose-300"
                            }`}
                          >
                            {t(`invoices.status.${invoice.status}`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={loadingServerData}
                            className="text-sm text-neutral-300 hover:text-white transition-colors"
                          >
                            {t("invoices.actions.downloadPdf")}
                          </button>
                        </div>
                      </div>
                    ))}

                    {recentInvoices.length === 0 && (
                      <div className="px-6 py-10 text-center text-sm text-neutral-500">
                        {t("invoices.recent.empty")}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeSection === "members" && (
              <div className="space-y-6 p-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-neutral-800">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("members.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      {t("members.description")}
                    </p>
                  </div>

                  <div className="divide-y divide-neutral-800">
                    {members.map((member) => (
                      <div key={member.email} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-neutral-400 mt-1">{member.email}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {member.role === "owner" || !canManageMembers ? (
                            <span className="text-xs px-2 py-1 rounded-full border border-neutral-700 text-neutral-300">
                              {roleLabel(member.role)}
                            </span>
                          ) : (
                            <CustomSelect
                              value={member.role}
                              onValueChange={(value) => handleMemberRoleUpdate(member, value)}
                              disabled={
                                !member.userId ||
                                updatingMemberId === member.userId ||
                                loadingServerData
                              }
                              options={memberAssignableRoles.map((role) => ({
                                value: role.key,
                                label: roleLabel(role.key),
                              }))}
                              triggerClassName="h-8 min-w-34 bg-neutral-800 border-neutral-700 text-xs text-white focus-visible:border-neutral-600"
                            />
                          )}

                          {canManageMembers && member.role !== "owner" && member.userId && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamMember(member)}
                              disabled={
                                removingMemberId === member.userId || loadingServerData
                              }
                              className="text-xs px-2 py-1 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors"
                            >
                              {t("members.actions.remove")}
                            </button>
                          )}

                          <span className="text-xs text-neutral-500">
                            {lastActiveLabel(member.lastActive)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {members.length === 0 && (
                      <div className="px-6 py-8 text-sm text-neutral-500 text-center">
                        {t("members.empty")}
                      </div>
                    )}
                  </div>
                </section>

                {pendingInvites.length > 0 && (
                  <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-neutral-800">
                      <h4 className="text-lg font-semibold text-white tracking-tight leading-7">
                        {t("members.pendingInvites.title")}
                      </h4>
                    </div>

                    <div className="divide-y divide-neutral-800">
                      {pendingInvites.map((invite) => (
                        <div
                          key={`${invite.email}-${invite.invitedAt}`}
                          className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{invite.email}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {t("members.pendingInvites.expires", {
                                date: dayFormatter.format(new Date(invite.expiresAt)),
                              })}
                            </p>
                          </div>

                          <span className="text-xs px-2 py-1 rounded-full border border-neutral-700 text-neutral-300 w-fit">
                            {roleLabel(normalizeMemberRole(invite.role))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <form
                  onSubmit={handleInviteMember}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white tracking-tight leading-7">
                      {t("members.inviteTitle")}
                    </h4>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          {t("members.emailLabel")}
                        </label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          disabled={!canManageMembers || invitingMember || loadingServerData}
                          placeholder={t("members.placeholders.email")}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          {t("members.roleLabel")}
                        </label>
                        <CustomSelect
                          value={inviteRole}
                          onValueChange={(value) => setInviteRole(value as InviteRole)}
                          disabled={!canManageMembers || invitingMember || loadingServerData}
                          options={memberAssignableRoles.map((role) => ({
                            value: role.key,
                            label: roleLabel(role.key),
                          }))}
                          triggerClassName="w-full bg-neutral-800 border-neutral-700 text-sm text-white focus-visible:border-neutral-600 focus-visible:ring-neutral-600/40"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!canManageMembers || invitingMember || loadingServerData}
                        className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                      >
                        {invitingMember
                          ? t("members.actions.sendingInvite")
                          : t("members.actions.sendInvite")}
                      </button>
                    </div>
                  </div>
                </form>

                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-neutral-800">
                    <h4 className="text-lg font-semibold text-white tracking-tight leading-7">
                      {t("members.customRoles.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      {t("members.customRoles.description")}
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      {customRoles.map((role) => (
                          <div
                            key={role.key}
                            className="rounded-md border border-neutral-800 bg-neutral-800/30 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{role.name}</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {role.description}
                                </p>
                                <p className="text-xs text-neutral-500 mt-2">
                                  {t("members.customRoles.inherits", {
                                    role: roleLabel(role.inherits),
                                  })}
                                </p>
                              </div>

                              {canManageRoles && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomRole(role.key)}
                                  disabled={
                                    deletingRoleKey === role.key || loadingServerData
                                  }
                                  className="text-xs px-2 py-1 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors"
                                >
                                  {t("members.customRoles.actions.delete")}
                                </button>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {role.permissions.map((permission) => (
                                <span
                                  key={`${role.key}-${permission}`}
                                  className="text-[11px] px-2 py-1 rounded-full border border-neutral-700 text-neutral-400"
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}

                      {customRoles.length === 0 && (
                        <p className="text-sm text-neutral-500">
                          {t("members.customRoles.empty")}
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleCreateCustomRole} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm text-neutral-300 mb-2">
                            {t("members.customRoles.form.name")}
                          </label>
                          <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            disabled={!canManageRoles || creatingRole || loadingServerData}
                            placeholder={t("members.customRoles.form.namePlaceholder")}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-neutral-300 mb-2">
                            {t("members.customRoles.form.inherits")}
                          </label>
                          <CustomSelect
                            value={newRoleInherits}
                            onValueChange={(value) =>
                              setNewRoleInherits(value as RoleInheritance)
                            }
                            disabled={!canManageRoles || creatingRole || loadingServerData}
                            options={[
                              { value: "admin", label: t("members.roles.admin") },
                              {
                                value: "billing_manager",
                                label: t("members.roles.billingManager"),
                              },
                              { value: "member", label: t("members.roles.member") },
                              { value: "viewer", label: t("members.roles.viewer") },
                            ]}
                            triggerClassName="w-full bg-neutral-800 border-neutral-700 text-sm text-white focus-visible:border-neutral-600 focus-visible:ring-neutral-600/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-neutral-300 mb-2">
                          {t("members.customRoles.form.description")}
                        </label>
                        <input
                          type="text"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          disabled={!canManageRoles || creatingRole || loadingServerData}
                          placeholder={t("members.customRoles.form.descriptionPlaceholder")}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                      </div>

                      <div>
                        <p className="block text-sm text-neutral-300 mb-2">
                          {t("members.customRoles.form.permissions")}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {roleCapabilityOptions.map((capability) => (
                            <label
                              key={capability.key}
                              className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/30 px-3 py-2"
                            >
                              <span className="text-xs text-neutral-300">
                                {capability.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={newRoleCapabilities.includes(capability.key)}
                                onChange={() => toggleRoleCapability(capability.key)}
                                disabled={
                                  !canManageRoles || creatingRole || loadingServerData
                                }
                                className="h-4 w-4 accent-white"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!canManageRoles || creatingRole || loadingServerData}
                          className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 transition-all"
                        >
                          {creatingRole
                            ? t("members.customRoles.actions.creating")
                            : t("members.customRoles.actions.create")}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              </div>
            )}

            {activeSection === "accessGroups" && (
              <div className="space-y-6 p-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-neutral-800">
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("accessGroups.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      {t("accessGroups.description")}
                    </p>
                  </div>

                  <div className="divide-y divide-neutral-800">
                    {groups.map((group) => (
                      <div key={group.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{group.name}</p>
                          <p className="text-xs text-neutral-400 mt-1">{group.description}</p>
                        </div>

                        <div className="text-xs text-neutral-400 text-right">
                          <p>
                            {t("accessGroups.labels.membersCount", {
                              count: group.members,
                            })}
                          </p>
                          <p>
                            {t("accessGroups.labels.permissionsCount", {
                              count: group.permissions,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="p-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm text-neutral-300 mb-2">
                        {t("accessGroups.form.newNameLabel")}
                      </label>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        disabled={
                          !canManageAccessGroups || loadingServerData || savingAccessGroup
                        }
                        placeholder={t("accessGroups.placeholders.newName")}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-300 mb-2">
                        {t("accessGroups.form.descriptionLabel")}
                      </label>
                      <input
                        type="text"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        disabled={
                          !canManageAccessGroups || loadingServerData || savingAccessGroup
                        }
                        placeholder={t("accessGroups.placeholders.optional")}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                      />
                    </div>

                    <div className="max-w-xs">
                      <label className="block text-sm text-neutral-300 mb-2">
                        {t("accessGroups.form.defaultAccessLabel")}
                      </label>
                      <CustomSelect
                        value={defaultAccess}
                        onValueChange={(value) =>
                          setDefaultAccess(value as AccessDefaultRole)
                        }
                        disabled={
                          !canManageAccessGroups || loadingServerData || savingAccessGroup
                        }
                        options={[
                          { value: "viewer", label: t("members.roles.viewer") },
                          { value: "member", label: t("members.roles.member") },
                          { value: "admin", label: t("members.roles.admin") },
                        ]}
                        triggerClassName="w-full bg-neutral-800 border-neutral-700 text-sm text-white focus-visible:border-neutral-600 focus-visible:ring-neutral-600/40"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateAccessGroup}
                      disabled={
                        !canManageAccessGroups || loadingServerData || savingAccessGroup
                      }
                      className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all w-fit self-end"
                    >
                      {t("accessGroups.actions.create")}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeSection === "webhooks" && (
              <form
                onSubmit={handleSaveWebhook}
                className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden p-6 space-y-5"
              >
                <div>
                  <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                    {t("webhooks.title")}
                  </h4>
                  <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                    {t("webhooks.description")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-neutral-300 mb-2">
                    {t("webhooks.endpointUrlLabel")}
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={
                      !canManageWebhooks || loadingServerData || savingWebhook
                    }
                    placeholder={t("webhooks.placeholders.endpointUrl")}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-300 mb-2">
                    {t("webhooks.signingSecretLabel")}
                  </label>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    disabled={
                      !canManageWebhooks || loadingServerData || savingWebhook
                    }
                    placeholder={t("webhooks.placeholders.signingSecret")}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-neutral-300">{t("webhooks.eventsLabel")}</p>

                  <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/40 px-4 py-3">
                    <span className="text-sm text-neutral-300">
                      {t("webhooks.events.incidentUpdates")}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyOnIncidents}
                      onChange={(e) => setNotifyOnIncidents(e.target.checked)}
                      disabled={
                        !canManageWebhooks || loadingServerData || savingWebhook
                      }
                      className="h-4 w-4 accent-white"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/40 px-4 py-3">
                    <span className="text-sm text-neutral-300">
                      {t("webhooks.events.domainStatusChanges")}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyOnDomains}
                      onChange={(e) => setNotifyOnDomains(e.target.checked)}
                      disabled={
                        !canManageWebhooks || loadingServerData || savingWebhook
                      }
                      className="h-4 w-4 accent-white"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/40 px-4 py-3">
                    <span className="text-sm text-neutral-300">
                      {t("webhooks.events.billingEvents")}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyOnBilling}
                      onChange={(e) => setNotifyOnBilling(e.target.checked)}
                      disabled={
                        !canManageWebhooks || loadingServerData || savingWebhook
                      }
                      className="h-4 w-4 accent-white"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendWebhookTest}
                    disabled={
                      sendingWebhookTest ||
                      savingWebhook ||
                      loadingServerData ||
                      !canManageWebhooks
                    }
                    className="border border-neutral-700 text-neutral-200 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-800 transition-all"
                  >
                    {sendingWebhookTest
                      ? t("webhooks.actions.sending")
                      : t("webhooks.actions.sendTestEvent")}
                  </button>

                  <button
                    type="submit"
                    disabled={!canManageWebhooks || loadingServerData || savingWebhook}
                    className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                  >
                    {t("webhooks.actions.save")}
                  </button>
                </div>

                {savedWebhook && (
                  <div className="rounded-md border border-neutral-800 bg-neutral-800/30 p-4 space-y-1">
                    <p className="text-sm text-neutral-300">
                      {t("webhooks.summary.activeEndpoint", { url: savedWebhook.url })}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t("webhooks.summary.secret", {
                        value: savedWebhook.secretMasked,
                      })}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t("webhooks.summary.events", {
                        value: savedWebhook.events.map(webhookEventLabel).join(", "),
                      })}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t("webhooks.summary.lastUpdated", {
                        value: savedWebhook.updatedAt,
                      })}
                    </p>
                  </div>
                )}
              </form>
            )}

            {activeSection === "securityPrivacy" && (
              <form
                onSubmit={handleSaveSecuritySettings}
                className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
              >
                <div className="p-6 space-y-5">
                  <div>
                    <h4 className="text-xl font-semibold text-white tracking-tight leading-8">
                      {t("securityPrivacy.title")}
                    </h4>
                    <p className="text-[14px] leading-6 text-neutral-400 mt-2">
                      {t("securityPrivacy.description")}
                    </p>
                  </div>

                  <label className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-800/40 px-4 py-3">
                    <span className="text-sm text-neutral-300">
                      {t("securityPrivacy.require2fa")}
                    </span>
                    <input
                      type="checkbox"
                      checked={require2FA}
                      onChange={(e) => setRequire2FA(e.target.checked)}
                      disabled={!canManageSecurity || loadingServerData || savingSecurity}
                      className="h-4 w-4 accent-white"
                    />
                  </label>

                  <div className="rounded-md border border-neutral-800 bg-neutral-800/30 p-4 space-y-3">
                    <p className="text-sm text-neutral-300">
                      {t("securityPrivacy.emailMethods")}
                    </p>

                    <label className="flex items-center justify-between">
                      <span className="text-sm text-neutral-300">
                        {t("securityPrivacy.enableMagicLink")}
                      </span>
                      <input
                        type="checkbox"
                        checked={allowMagicLink}
                        onChange={(e) => toggleMagicLink(e.target.checked)}
                        disabled={
                          !canManageSecurity || loadingServerData || savingSecurity
                        }
                        className="h-4 w-4 accent-white"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-sm text-neutral-300">
                        {t("securityPrivacy.enableEmailCode")}
                      </span>
                      <input
                        type="checkbox"
                        checked={allowEmailCode}
                        onChange={(e) => toggleEmailCode(e.target.checked)}
                        disabled={
                          !canManageSecurity || loadingServerData || savingSecurity
                        }
                        className="h-4 w-4 accent-white"
                      />
                    </label>
                  </div>

                  <div className="max-w-xs">
                    <label className="block text-sm text-neutral-300 mb-2">
                      {t("securityPrivacy.retentionDaysLabel")}
                    </label>
                    <input
                      type="number"
                      min={RETENTION_DAYS_MIN}
                      max={RETENTION_DAYS_MAX}
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(e.target.value)}
                      disabled={!canManageSecurity || loadingServerData || savingSecurity}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                    />
                  </div>

                  {securityMessage && (
                    <p
                      className={`text-sm ${
                        securityMessage === "saved"
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}
                    >
                      {t(`securityPrivacy.messages.${securityMessage}`)}
                    </p>
                  )}
                </div>

                <footer className="bg-neutral-800/70 border-t border-neutral-700/65 px-6 py-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!canManageSecurity || loadingServerData || savingSecurity}
                    className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all"
                  >
                    {t("securityPrivacy.actions.save")}
                  </button>
                </footer>
              </form>
            )}

            {activeSection === "appsIntegrations" && (
              <>
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder={t("searchIntegrationsPlaceholder")}
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

                {filteredIntegrations.length === 0 && (
                  <p className="text-neutral-500 text-center mt-10">
                    {integrationsT("empty")}
                  </p>
                )}
              </>
            )}
          </main>
        </div>

        <IntegrationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          integration={selectedIntegration}
        />
      </div>
    </div>
  );
}
