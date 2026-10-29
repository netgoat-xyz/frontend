import crypto from "node:crypto";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Roles & capabilities                                                       */
/* -------------------------------------------------------------------------- */

export const TEAM_CAPABILITIES = [
  "team.view",
  "team.settings.update",
  "members.view",
  "members.invite",
  "members.role.update",
  "members.remove",
  "roles.manage",
  "billing.view",
  "billing.manage",
  "invoices.view",
  "invoices.manage",
  "domains.view",
  "domains.manage",
  "integrations.manage",
  "security.manage",
] as const;

export type TeamCapability = (typeof TEAM_CAPABILITIES)[number];

export const TEAM_BUILTIN_ROLES = [
  "owner",
  "admin",
  "billing_manager",
  "member",
  "viewer",
] as const;

export type TeamBuiltinRole = (typeof TEAM_BUILTIN_ROLES)[number];
export type TeamRoleInheritance = Exclude<TeamBuiltinRole, "owner">;

/** Which built-in roles a role may inherit from. */
export const ROLE_PERMISSION_MATRIX: Record<TeamBuiltinRole, TeamBuiltinRole[]> = {
  owner: ["owner", "admin", "member", "viewer"],
  admin: ["admin", "member", "viewer"],
  billing_manager: ["viewer"],
  member: ["member", "viewer"],
  viewer: ["viewer"],
};

export const BUILTIN_ROLE_CAPABILITIES: Record<TeamBuiltinRole, readonly string[]> = {
  owner: ["*"],
  admin: [
    "team.view",
    "team.settings.update",
    "members.view",
    "members.invite",
    "members.role.update",
    "members.remove",
    "roles.manage",
    "billing.view",
    "billing.manage",
    "invoices.view",
    "invoices.manage",
    "domains.view",
    "domains.manage",
    "integrations.manage",
    "security.manage",
  ],
  billing_manager: [
    "team.view",
    "members.view",
    "billing.view",
    "billing.manage",
    "invoices.view",
    "invoices.manage",
  ],
  member: [
    "team.view",
    "members.view",
    "domains.view",
    "domains.manage",
    "integrations.manage",
    "invoices.view",
  ],
  viewer: ["team.view", "members.view", "domains.view", "billing.view", "invoices.view"],
};

export const BUILTIN_ROLE_META: Record<
  TeamBuiltinRole,
  { name: string; description: string; inherits: TeamBuiltinRole }
> = {
  owner: {
    name: "Owner",
    description: "Full access to all team resources and role administration.",
    inherits: "owner",
  },
  admin: {
    name: "Admin",
    description: "Manage team settings, members, billing, and infrastructure resources.",
    inherits: "admin",
  },
  billing_manager: {
    name: "Billing Manager",
    description: "Manage billing contacts, invoices, and payment operations.",
    inherits: "billing_manager",
  },
  member: {
    name: "Member",
    description: "Standard collaborator access for day-to-day workspace operations.",
    inherits: "member",
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to team resources and billing overviews.",
    inherits: "viewer",
  },
};

/* -------------------------------------------------------------------------- */
/* Embedded documents                                                          */
/* -------------------------------------------------------------------------- */

const TeamMemberSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "member" },
    joined_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TeamInviteSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, default: "member" },
    invited_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invited_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    token: { type: String, required: true },
    accepted: { type: Boolean, default: false },
  },
  { _id: false },
);

const TeamCustomRoleSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    inherits: {
      type: String,
      enum: ["admin", "billing_manager", "member", "viewer"],
      default: "member",
    },
    permissions: [{ type: String, enum: TEAM_CAPABILITIES }],
    created_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TeamAccessGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    members: { type: Number, min: 0, default: 0 },
    permissions: { type: Number, min: 0, default: 0 },
    default_role: {
      type: String,
      enum: ["viewer", "member", "admin"],
      default: "viewer",
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TeamWebhookSettingsSchema = new Schema(
  {
    endpoint_url: { type: String },
    signing_secret: { type: String },
    events: { type: [String], default: [] },
    updated_at: { type: Date },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    avatar_url: { type: String },

    members: { type: [TeamMemberSchema], default: [] },
    invites: { type: [TeamInviteSchema], default: [] },
    custom_roles: { type: [TeamCustomRoleSchema], default: [] },

    max_domains: { type: Number, default: 5 },
    max_members: { type: Number, default: 5 },
    domain_count: { type: Number, default: 0 },

    total_requests: { type: Number, default: 0 },
    total_blocked: { type: Number, default: 0 },
    total_bandwidth: { type: Number, default: 0 },

    settings: {
      allow_member_invites: { type: Boolean, default: false },
      require_2fa: { type: Boolean, default: false },
      ip_whitelist: { type: [String], default: [] },
      access_groups: { type: [TeamAccessGroupSchema], default: [] },
      webhooks: {
        type: TeamWebhookSettingsSchema,
        default: () => ({ events: [] }),
      },
      auth_methods: {
        magic_link: { type: Boolean, default: true },
        email_code: { type: Boolean, default: true },
      },
      retention_days: { type: Number, min: 7, max: 365, default: 90 },
      billing: {
        auto_recharge: { type: Boolean, default: true },
        invoice_email: { type: String },
        po_number: { type: String },
        billing_interval: {
          type: String,
          enum: ["monthly", "annual"],
          default: "monthly",
        },
        seat_count: { type: Number, min: 1, default: 1 },
      },
    },

    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    subscription_id: { type: String },
    billing_email: { type: String },

    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "teams", versionKey: "__v" },
);

TeamSchema.index({ slug: 1 }, { unique: true });
TeamSchema.index({ "members.user_id": 1 });

TeamSchema.virtual("can_add_domain").get(function (this: { domain_count: number; max_domains: number }) {
  return this.domain_count < this.max_domains;
});

TeamSchema.virtual("can_add_member").get(function (this: { members: unknown[]; max_members: number }) {
  return this.members.length < this.max_members;
});

export type TeamMember = {
  user_id: Types.ObjectId;
  role: string;
  joined_at: Date;
};

export type TeamInvite = {
  email: string;
  role: string;
  invited_by: Types.ObjectId;
  invited_at: Date;
  expires_at: Date;
  token: string;
  accepted: boolean;
};

export type TeamCustomRole = {
  key: string;
  name: string;
  description: string;
  inherits: TeamRoleInheritance;
  permissions: TeamCapability[];
  created_at: Date;
};

export type TeamAccessGroup = {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: number;
  default_role: "viewer" | "member" | "admin";
  created_at: Date;
  updated_at: Date;
};

export type TeamWebhookSettings = {
  endpoint_url?: string;
  signing_secret?: string;
  events: string[];
  updated_at?: Date;
  updated_by?: Types.ObjectId;
};

export type TeamDocument = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  members: TeamMember[];
  invites: TeamInvite[];
  custom_roles: TeamCustomRole[];
  max_domains: number;
  max_members: number;
  domain_count: number;
  total_requests: number;
  total_blocked: number;
  total_bandwidth: number;
  settings: {
    allow_member_invites: boolean;
    require_2fa: boolean;
    ip_whitelist: string[];
    access_groups: TeamAccessGroup[];
    webhooks: TeamWebhookSettings;
    auth_methods: { magic_link: boolean; email_code: boolean };
    retention_days: number;
    billing: {
      auto_recharge: boolean;
      invoice_email?: string;
      po_number?: string;
      billing_interval: "monthly" | "annual";
      seat_count: number;
    };
  };
  plan: "free" | "pro" | "enterprise";
  subscription_id?: string;
  billing_email?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

/* -------------------------------------------------------------------------- */
/* Role resolution helpers                                                     */
/* -------------------------------------------------------------------------- */

export const isBuiltinRole = (value: string): value is TeamBuiltinRole =>
  (TEAM_BUILTIN_ROLES as readonly string[]).includes(value);

export type ResolvedTeamRole = {
  key: string;
  name: string;
  description: string;
  inherits: string;
  capabilities: string[];
  isPreset: boolean;
};

/**
 * Resolves the effective capability list for a role key on a team,
 * accounting for custom roles that inherit from built-in roles.
 */
export function resolveTeamRole(
  team: Pick<TeamDocument, "custom_roles">,
  roleKey: string,
): ResolvedTeamRole | null {
  if (isBuiltinRole(roleKey)) {
    const meta = BUILTIN_ROLE_META[roleKey];
    return {
      key: roleKey,
      name: meta.name,
      description: meta.description,
      inherits: meta.inherits,
      capabilities: [...BUILTIN_ROLE_CAPABILITIES[roleKey]],
      isPreset: true,
    };
  }

  const custom = team.custom_roles.find((role) => role.key === roleKey);
  if (!custom) return null;

  const inherited = BUILTIN_ROLE_CAPABILITIES[custom.inherits] ?? [];
  const merged = new Set<string>([...inherited, ...custom.permissions]);

  return {
    key: custom.key,
    name: custom.name,
    description: custom.description,
    inherits: custom.inherits,
    capabilities: [...merged],
    isPreset: false,
  };
}

/** Checks whether a resolved role grants a capability ("*" grants everything). */
export function roleHasCapability(role: ResolvedTeamRole, capability: TeamCapability): boolean {
  return role.capabilities.includes("*") || role.capabilities.includes(capability);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function normalizeRoleKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

export function createInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const Team: Model<TeamDocument> =
  (mongoose.models.Team as Model<TeamDocument>) ??
  mongoose.model<TeamDocument>("Team", TeamSchema, "teams");

export default Team;
