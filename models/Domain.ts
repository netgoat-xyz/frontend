import mongoose, { Schema, type Model, type Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Embedded documents                                                          */
/* -------------------------------------------------------------------------- */

const DomainWAFRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    expression: { type: String, required: true },
    action: { type: String, enum: ["BLOCK", "ALLOW", "LOG"], default: "BLOCK" },
    priority: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    description: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SubdomainWAFRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    expression: { type: String, required: true },
    action: { type: String, enum: ["BLOCK", "ALLOW", "LOG"], default: "BLOCK" },
    priority: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SubdomainSchema = new Schema(
  {
    subdomain: { type: String, required: true },
    full_domain: { type: String, required: true },
    target_url: { type: String, required: true },
    active: { type: Boolean, default: true },
    certificate_pem: String,
    private_key_pem: String,
    route_policy: { type: Schema.Types.Mixed },
    waf_rules: { type: [SubdomainWAFRuleSchema], default: [] },
    request_count: { type: Number, default: 0 },
    blocked_count: { type: Number, default: 0 },
    last_accessed: Date,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ReverseProxySchema = new Schema(
  {
    name: { type: String, required: true },
    path: { type: String, default: "/*" },
    target_url: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    preserve_host: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Domain                                                                      */
/* -------------------------------------------------------------------------- */

const DomainSchema = new Schema(
  {
    /** Legacy single-user ownership (kept for compatibility). */
    user_id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    /** Team ownership. */
    team_id: { type: Schema.Types.ObjectId, ref: "Team", index: true },

    domain: { type: String, required: true, lowercase: true, trim: true },
    target_url: String,

    certificate_pem: String,
    private_key_pem: String,
    ssl_enabled: { type: Boolean, default: false },
    auto_ssl: { type: Boolean, default: false },

    route_policy: { type: Schema.Types.Mixed },

    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    verification_token: String,
    last_verification_check: Date,
    verification_attempts: { type: Number, default: 0 },
    next_verification_check: Date,

    waf_rules: { type: [DomainWAFRuleSchema], default: [] },
    subdomains: { type: [SubdomainSchema], default: [] },
    reverse_proxies: { type: [ReverseProxySchema], default: [] },

    settings: {
      rate_limit: { type: Number, default: 100 },
      cache_enabled: { type: Boolean, default: true },
      cache_ttl: { type: Number, default: 300 },
      compression_enabled: { type: Boolean, default: true },
      log_level: { type: String, enum: ["none", "errors", "all"], default: "errors" },
    },

    stats: {
      total_requests: { type: Number, default: 0 },
      total_blocked: { type: Number, default: 0 },
      bandwidth_used: { type: Number, default: 0 },
      last_request: Date,
    },
  },
  {
    collection: "domains",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: "__v",
  },
);

DomainSchema.index(
  { user_id: 1, domain: 1 },
  { unique: true, partialFilterExpression: { user_id: { $exists: true, $ne: null } } },
);
DomainSchema.index(
  { team_id: 1, domain: 1 },
  { unique: true, partialFilterExpression: { team_id: { $exists: true, $ne: null } } },
);
DomainSchema.index({ domain: 1 });
DomainSchema.index({ "subdomains.full_domain": 1 });

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type WAFRule = {
  name: string;
  expression: string;
  action: "BLOCK" | "ALLOW" | "LOG";
  priority: number;
  enabled: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
};

export type SubdomainWAFRule = Omit<WAFRule, "description">;

export type DomainSubdomain = {
  subdomain: string;
  full_domain: string;
  target_url: string;
  active: boolean;
  certificate_pem?: string;
  private_key_pem?: string;
  route_policy?: unknown;
  waf_rules: SubdomainWAFRule[];
  request_count: number;
  blocked_count: number;
  last_accessed?: Date;
  created_at: Date;
  updated_at: Date;
};

export type ReverseProxyRule = {
  name: string;
  path: string;
  target_url: string;
  enabled: boolean;
  preserve_host: boolean;
  created_at: Date;
};

export type DomainDocument = {
  _id: Types.ObjectId;
  user_id?: Types.ObjectId | null;
  team_id?: Types.ObjectId | null;
  domain: string;
  target_url?: string;
  certificate_pem?: string;
  private_key_pem?: string;
  ssl_enabled: boolean;
  auto_ssl: boolean;
  route_policy?: unknown;
  active: boolean;
  verified: boolean;
  verification_token?: string;
  last_verification_check?: Date;
  verification_attempts: number;
  next_verification_check?: Date | null;
  waf_rules: WAFRule[];
  subdomains: DomainSubdomain[];
  reverse_proxies: ReverseProxyRule[];
  settings: {
    rate_limit: number;
    cache_enabled: boolean;
    cache_ttl: number;
    compression_enabled: boolean;
    log_level: "none" | "errors" | "all";
  };
  stats: {
    total_requests: number;
    total_blocked: number;
    bandwidth_used: number;
    last_request?: Date;
  };
  created_at: Date;
  updated_at: Date;
};

export const Domain: Model<DomainDocument> =
  (mongoose.models.Domain as Model<DomainDocument>) ??
  mongoose.model<DomainDocument>("Domain", DomainSchema, "domains");

export default Domain;
