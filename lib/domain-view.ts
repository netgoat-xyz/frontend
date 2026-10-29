/**
 * Client-safe projections of domain documents.
 *
 * Certificate private keys never leave the server: every client component
 * receives these shapes instead of raw documents.
 */

import type { AccessControl, RoutePolicy } from "@/lib/control-plane";
import { normalizeAccessControl, normalizeRoutePolicy } from "@/lib/control-plane";
import { DOMAIN_VERIFICATION_RECORD_NAME } from "@/lib/domain-verification";
import type { DomainDocument } from "@/models/Domain";
import type { DNSRecordDocument, DNSRecordType } from "@/models/DNSRecord";
import type { ProxyConfigDocument } from "@/models/ProxyConfig";

export type ClientWafRule = {
  name: string;
  expression: string;
  language?: "wafl" | "wafscript";
  action: "BLOCK" | "ALLOW" | "LOG";
  priority: number;
  enabled: boolean;
  description?: string;
  created_at: string;
};

export type ClientSubdomain = {
  subdomain: string;
  full_domain: string;
  target_url: string;
  active: boolean;
  hasManualCertificate: boolean;
  access_control: AccessControl;
  wafRules: ClientWafRule[];
  request_count: number;
  blocked_count: number;
};

export type ClientDomain = {
  _id: string;
  domain: string;
  target_url: string;
  active: boolean;
  verified: boolean;
  ssl_enabled: boolean;
  auto_ssl: boolean;
  hasManualCertificate: boolean;
  access_control: AccessControl;
  route_policy: RoutePolicy | null;
  /** Ownership TXT record, present until the domain is verified. */
  verification: { recordName: string; recordValue: string } | null;
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
    last_request: string | null;
  };
  wafRules: ClientWafRule[];
  subdomains: ClientSubdomain[];
  created_at: string;
};

export type ClientDNSRecord = {
  _id: string;
  type: DNSRecordType;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  proxied: boolean;
  propagated: boolean;
  last_checked: string | null;
  created_at: string;
};

export type ClientProxyConfig = {
  _id: string;
  name: string;
  subdomain: string | null;
  upstream_servers: string[];
  preserve_host: boolean;
  websocket_enabled: boolean;
  health_check_path: string;
  enabled: boolean;
  total_requests: number;
  total_errors: number;
};

function serializeWafRules(
  rules: DomainDocument["waf_rules"] | undefined,
): ClientWafRule[] {
  return (rules ?? []).map((rule) => ({
    name: rule.name,
    expression: rule.expression,
    language: rule.language,
    action: rule.action,
    priority: rule.priority,
    enabled: rule.enabled,
    description: rule.description,
    created_at: new Date(rule.created_at).toISOString(),
  }));
}

export function toClientDomain(domain: DomainDocument): ClientDomain {
  return {
    _id: String(domain._id),
    domain: domain.domain,
    target_url: domain.target_url ?? "",
    active: Boolean(domain.active),
    verified: Boolean(domain.verified),
    ssl_enabled: Boolean(domain.ssl_enabled),
    auto_ssl: Boolean(domain.auto_ssl),
    hasManualCertificate: Boolean(domain.certificate_pem),
    access_control: normalizeAccessControl(domain.access_control, {
      defaultMode: "off",
    }),
    route_policy: normalizeRoutePolicy(domain.route_policy ?? null),
    verification:
      !domain.verified && domain.verification_token
        ? {
            recordName: DOMAIN_VERIFICATION_RECORD_NAME,
            recordValue: domain.verification_token,
          }
        : null,
    settings: {
      rate_limit: domain.settings?.rate_limit ?? 100,
      cache_enabled: domain.settings?.cache_enabled ?? true,
      cache_ttl: domain.settings?.cache_ttl ?? 300,
      compression_enabled: domain.settings?.compression_enabled ?? true,
      log_level: domain.settings?.log_level ?? "errors",
    },
    stats: {
      total_requests: domain.stats?.total_requests ?? 0,
      total_blocked: domain.stats?.total_blocked ?? 0,
      bandwidth_used: domain.stats?.bandwidth_used ?? 0,
      last_request: domain.stats?.last_request
        ? new Date(domain.stats.last_request).toISOString()
        : null,
    },
    wafRules: serializeWafRules(domain.waf_rules),
    subdomains: (domain.subdomains ?? []).map((entry) => ({
      subdomain: entry.subdomain,
      full_domain: entry.full_domain,
      target_url: entry.target_url,
      active: Boolean(entry.active),
      hasManualCertificate: Boolean(entry.certificate_pem),
      access_control: normalizeAccessControl(entry.access_control, {
        allowInherit: true,
        defaultMode: "inherit",
      }),
      wafRules: serializeWafRules(entry.waf_rules),
      request_count: entry.request_count ?? 0,
      blocked_count: entry.blocked_count ?? 0,
    })),
    created_at: new Date(domain.created_at).toISOString(),
  };
}

export function toClientDNSRecord(record: DNSRecordDocument): ClientDNSRecord {
  return {
    _id: String(record._id),
    type: record.type,
    name: record.name,
    value: record.value,
    ttl: record.ttl,
    priority: record.priority ?? null,
    proxied: Boolean(record.proxied),
    propagated: Boolean(record.propagated),
    last_checked: record.last_checked
      ? new Date(record.last_checked).toISOString()
      : null,
    created_at: new Date(record.created_at).toISOString(),
  };
}

export function toClientProxyConfig(config: ProxyConfigDocument): ClientProxyConfig {
  return {
    _id: String(config._id),
    name: config.name,
    subdomain: config.subdomain ?? null,
    upstream_servers: (config.upstream_servers ?? []).map((server) => server.url),
    preserve_host: Boolean(config.preserve_host),
    websocket_enabled: Boolean(config.websocket_enabled),
    health_check_path: config.health_check?.path ?? "/",
    enabled: Boolean(config.enabled),
    total_requests: config.total_requests ?? 0,
    total_errors: config.total_errors ?? 0,
  };
}
