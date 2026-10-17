import mongoose, { Schema, type Model, type Types } from "mongoose";

export const LOAD_BALANCING_STRATEGIES = [
  "round_robin",
  "least_connections",
  "ip_hash",
  "weighted",
] as const;

export type LoadBalancingStrategy = (typeof LOAD_BALANCING_STRATEGIES)[number];
export type UpstreamHealth = "healthy" | "unhealthy" | "unknown";

const UpstreamServerSchema = new Schema(
  {
    url: { type: String, required: true },
    weight: { type: Number, default: 1 },
    max_fails: { type: Number, default: 3 },
    fail_timeout: { type: Number, default: 30 },
    backup: { type: Boolean, default: false },
    down: { type: Boolean, default: false },
    health_status: {
      type: String,
      enum: ["healthy", "unhealthy", "unknown"],
      default: "unknown",
    },
    last_health_check: Date,
  },
  { _id: false },
);

const HealthCheckSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    interval: { type: Number, default: 30 },
    timeout: { type: Number, default: 5 },
    path: { type: String, default: "/" },
    expected_status: { type: Number, default: 200 },
    fall: { type: Number, default: 3 },
    rise: { type: Number, default: 2 },
  },
  { _id: false },
);

const ProxyHeaderSchema = new Schema(
  { name: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false },
);

const PathRewriteSchema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    regex: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProxyConfigSchema = new Schema(
  {
    team_id: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    domain_id: { type: Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    name: { type: String, required: true },
    /** null/undefined for domain-wide configs. */
    subdomain: String,

    upstream_servers: { type: [UpstreamServerSchema], default: [] },
    load_balancing: {
      type: String,
      enum: LOAD_BALANCING_STRATEGIES,
      default: "round_robin",
    },

    health_check: { type: HealthCheckSchema, default: () => ({}) },

    connect_timeout: { type: Number, default: 60 },
    send_timeout: { type: Number, default: 60 },
    read_timeout: { type: Number, default: 60 },

    keepalive_timeout: { type: Number, default: 75 },
    keepalive_requests: { type: Number, default: 100 },
    max_idle_connections: { type: Number, default: 100 },

    ssl_verify: { type: Boolean, default: true },
    ssl_protocols: { type: [String], default: ["TLSv1.2", "TLSv1.3"] },

    custom_headers: { type: [ProxyHeaderSchema], default: [] },
    preserve_host: { type: Boolean, default: true },

    path_rewrites: { type: [PathRewriteSchema], default: [] },
    strip_path: { type: Boolean, default: false },

    buffer_requests: { type: Boolean, default: false },
    buffer_responses: { type: Boolean, default: false },
    buffer_size: { type: Number, default: 4096 },

    retry_attempts: { type: Number, default: 0 },
    retry_timeout: { type: Number, default: 0 },

    websocket_enabled: { type: Boolean, default: false },

    total_requests: { type: Number, default: 0 },
    total_errors: { type: Number, default: 0 },
    avg_response_time: { type: Number, default: 0 },

    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: "__v" },
);

ProxyConfigSchema.index({ team_id: 1, domain_id: 1 });
ProxyConfigSchema.index({ team_id: 1, enabled: 1 });

export type UpstreamServer = {
  url: string;
  weight: number;
  max_fails: number;
  fail_timeout: number;
  backup: boolean;
  down: boolean;
  health_status: UpstreamHealth;
  last_health_check?: Date;
};

export type ProxyHealthCheck = {
  enabled: boolean;
  interval: number;
  timeout: number;
  path: string;
  expected_status: number;
  fall: number;
  rise: number;
};

export type ProxyHeader = { name: string; value: string };
export type PathRewrite = { from: string; to: string; regex: boolean };

export type ProxyConfigDocument = {
  _id: Types.ObjectId;
  team_id: Types.ObjectId;
  domain_id: Types.ObjectId;
  name: string;
  subdomain?: string | null;
  upstream_servers: UpstreamServer[];
  load_balancing: LoadBalancingStrategy;
  health_check: ProxyHealthCheck;
  connect_timeout: number;
  send_timeout: number;
  read_timeout: number;
  keepalive_timeout: number;
  keepalive_requests: number;
  max_idle_connections: number;
  ssl_verify: boolean;
  ssl_protocols: string[];
  custom_headers: ProxyHeader[];
  preserve_host: boolean;
  path_rewrites: PathRewrite[];
  strip_path: boolean;
  buffer_requests: boolean;
  buffer_responses: boolean;
  buffer_size: number;
  retry_attempts: number;
  retry_timeout: number;
  websocket_enabled: boolean;
  total_requests: number;
  total_errors: number;
  avg_response_time: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const ProxyConfig: Model<ProxyConfigDocument> =
  (mongoose.models.ProxyConfig as Model<ProxyConfigDocument>) ??
  mongoose.model<ProxyConfigDocument>("ProxyConfig", ProxyConfigSchema, "proxyconfigs");

export default ProxyConfig;
