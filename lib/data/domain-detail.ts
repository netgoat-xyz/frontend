import { cache } from "react";

import dbConnect from "@/lib/mongoose";
import { getTeamContext, type SessionUser } from "@/lib/auth-guards";
import { findTeamDomainByName } from "@/lib/data/domains";
import type { DomainDocument } from "@/models/Domain";
import type { TeamDocument } from "@/models/Team";
import ProxyConfig, { type ProxyConfigDocument } from "@/models/ProxyConfig";

export type DomainRouteContext = {
  context: { user: SessionUser; team: TeamDocument };
  domain: DomainDocument;
};

/**
 * Resolves a domain inside a team route. Wrapped in cache() so the layout and
 * the page it renders share a single lookup per request.
 */
export const getDomainRoute = cache(
  async (
    teamName: string,
    domainName: string,
  ): Promise<DomainRouteContext | null> => {
    const context = await getTeamContext(teamName);
    if (!context.team) return null;
    const team = context.team;

    const domain = await findTeamDomainByName(
      String(team._id),
      decodeURIComponent(domainName),
    );

    if (!domain) return null;
    return { context: { user: context.user, team }, domain };
  },
);

/** Resolves a subdomain entry inside a domain route. */
export const getSubdomainRoute = cache(
  async (
    teamName: string,
    domainName: string,
    subdomainLabel: string,
  ): Promise<
    | (DomainRouteContext & { subdomain: NonNullable<DomainDocument["subdomains"]>[number] })
    | null
  > => {
    const result = await getDomainRoute(teamName, domainName);
    if (!result) return null;

    const label = decodeURIComponent(subdomainLabel).toLowerCase();
    const subdomain = result.domain.subdomains?.find(
      (entry) => entry.subdomain === label,
    );

    if (!subdomain) return null;
    return { ...result, subdomain };
  },
);

/** ProxyConfig documents for one domain (all scopes). */
export const listDomainProxyConfigs = cache(
  async (teamId: string, domainId: string): Promise<ProxyConfigDocument[]> => {
    await dbConnect();
    return ProxyConfig.find({ team_id: teamId, domain_id: domainId })
      .sort({ createdAt: 1 })
      .lean<ProxyConfigDocument[]>();
  },
);
