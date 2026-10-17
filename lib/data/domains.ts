import mongoose from "mongoose";

import dbConnect from "@/lib/mongoose";
import DNSRecord from "@/models/DNSRecord";
import Domain, { type DomainDocument } from "@/models/Domain";
import ProxyConfig from "@/models/ProxyConfig";

const toObjectId = (id: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(id);

export type TeamDomainSummary = {
  _id: string;
  domain: string;
  target_url?: string;
  active: boolean;
  verified: boolean;
  ssl_enabled: boolean;
  auto_ssl: boolean;
  subdomainCount: number;
  wafRuleCount: number;
  total_requests: number;
  total_blocked: number;
  bandwidth_used: number;
  last_request: string | null;
  created_at: string;
};

export type TeamOverview = {
  domainCount: number;
  activeDomains: number;
  sslDomains: number;
  unverifiedDomains: number;
  totalRequests: number;
  totalBlocked: number;
  bandwidthUsed: number;
};

function summarize(domain: DomainDocument): TeamDomainSummary {
  return {
    _id: String(domain._id),
    domain: domain.domain,
    target_url: domain.target_url,
    active: domain.active,
    verified: domain.verified,
    ssl_enabled: domain.ssl_enabled,
    auto_ssl: domain.auto_ssl,
    subdomainCount: domain.subdomains?.length ?? 0,
    wafRuleCount: domain.waf_rules?.length ?? 0,
    total_requests: domain.stats?.total_requests ?? 0,
    total_blocked: domain.stats?.total_blocked ?? 0,
    bandwidth_used: domain.stats?.bandwidth_used ?? 0,
    last_request: domain.stats?.last_request
      ? new Date(domain.stats.last_request).toISOString()
      : null,
    created_at: new Date(domain.created_at).toISOString(),
  };
}

/** All domains owned by a team, newest first, shaped for the UI. */
export async function listTeamDomainSummaries(
  teamId: string,
): Promise<TeamDomainSummary[]> {
  await dbConnect();
  const domains = await Domain.find({ team_id: toObjectId(teamId) })
    .sort({ created_at: -1 })
    .lean<DomainDocument[]>();

  return domains.map(summarize);
}

/** Full domain documents for a team (used by pages that need deep fields). */
export async function listTeamDomains(teamId: string): Promise<DomainDocument[]> {
  await dbConnect();
  return Domain.find({ team_id: toObjectId(teamId) })
    .sort({ created_at: -1 })
    .lean<DomainDocument[]>();
}

/** A single domain scoped to its team — returns null when not found/owned. */
export async function findTeamDomainByName(
  teamId: string,
  domainName: string,
): Promise<DomainDocument | null> {
  await dbConnect();
  return Domain.findOne({
    team_id: toObjectId(teamId),
    domain: domainName.toLowerCase(),
  }).lean<DomainDocument>();
}

export async function findTeamDomainById(
  teamId: string,
  domainId: string,
): Promise<DomainDocument | null> {
  if (!mongoose.isValidObjectId(domainId)) return null;
  await dbConnect();
  return Domain.findOne({
    _id: toObjectId(domainId),
    team_id: toObjectId(teamId),
  }).lean<DomainDocument>();
}

/** Aggregated usage numbers for the team overview — one database round trip. */
export async function getTeamOverview(teamId: string): Promise<TeamOverview> {
  await dbConnect();

  const [result] = await Domain.aggregate<{
    domainCount: number;
    activeDomains: number;
    sslDomains: number;
    unverifiedDomains: number;
    totalRequests: number;
    totalBlocked: number;
    bandwidthUsed: number;
  }>([
    { $match: { team_id: toObjectId(teamId) } },
    {
      $group: {
        _id: null,
        domainCount: { $sum: 1 },
        activeDomains: { $sum: { $cond: ["$active", 1, 0] } },
        sslDomains: { $sum: { $cond: ["$ssl_enabled", 1, 0] } },
        unverifiedDomains: { $sum: { $cond: ["$verified", 0, 1] } },
        totalRequests: { $sum: "$stats.total_requests" },
        totalBlocked: { $sum: "$stats.total_blocked" },
        bandwidthUsed: { $sum: "$stats.bandwidth_used" },
      },
    },
  ]);

  return (
    result ?? {
      domainCount: 0,
      activeDomains: 0,
      sslDomains: 0,
      unverifiedDomains: 0,
      totalRequests: 0,
      totalBlocked: 0,
      bandwidthUsed: 0,
    }
  );
}

/** Resource counts shown as small badges around the dashboard. */
export async function getTeamResourceCounts(teamId: string): Promise<{
  dnsRecords: number;
  proxyConfigs: number;
}> {
  await dbConnect();
  const teamObjectId = toObjectId(teamId);

  const [dnsRecords, proxyConfigs] = await Promise.all([
    DNSRecord.countDocuments({ team_id: teamObjectId }),
    ProxyConfig.countDocuments({ team_id: teamObjectId }),
  ]);

  return { dnsRecords, proxyConfigs };
}
