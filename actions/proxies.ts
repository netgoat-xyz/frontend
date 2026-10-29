"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import { validateOriginUrl } from "@/lib/validation/domain";
import Domain from "@/models/Domain";
import ProxyConfig from "@/models/ProxyConfig";

const MAX_UPSTREAMS = 8;

function revalidateDomain(teamSlug: string, domainName: string) {
  revalidatePath(`/dashboard/${teamSlug}/${domainName}`, "layout");
}

const upsertSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  configId: z.string().min(1).optional(),
  subdomain: z.string().min(1).max(63).optional(),
  name: z.string().trim().max(64).optional(),
  upstream_servers: z.array(z.string().min(1)).min(1).max(MAX_UPSTREAMS),
  preserve_host: z.boolean().default(true),
  websocket_enabled: z.boolean().default(false),
  health_check_path: z.string().trim().max(512).default("/"),
  enabled: z.boolean().default(true),
});

export async function upsertProxyConfigAction(input: {
  teamSlug: string;
  domainId: string;
  configId?: string;
  subdomain?: string;
  name?: string;
  upstream_servers: string[];
  preserve_host?: boolean;
  websocket_enabled?: boolean;
  health_check_path?: string;
  enabled?: boolean;
}): Promise<ActionResult<{ configId: string }>> {
  try {
    const parsed = upsertSchema.parse(input);
    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const domain = await Domain.findOne({
      _id: parsed.domainId,
      team_id: context.team._id,
      active: true,
    });

    if (!domain) throw new DomainError("Domain not found.");

    const scopeSubdomain = parsed.subdomain?.trim().toLowerCase() || null;

    if (scopeSubdomain) {
      const exists = domain.subdomains.some(
        (entry) => entry.subdomain === scopeSubdomain,
      );
      if (!exists) {
        throw new DomainError("Add the subdomain before attaching routes to it.");
      }
    }

    // Normalize, validate and de-duplicate the upstream pool.
    const upstreams: string[] = [];
    for (const raw of parsed.upstream_servers) {
      const origin = validateOriginUrl(raw);
      if (!origin.valid) throw new DomainError(origin.message);
      if (!upstreams.includes(origin.origin)) upstreams.push(origin.origin);
    }

    if (upstreams.length === 0) {
      throw new DomainError("Add at least one upstream server.");
    }

    const healthPath = parsed.health_check_path.trim() || "/";
    const normalizedHealthPath = healthPath.startsWith("/")
      ? healthPath
      : `/${healthPath}`;

    let config = parsed.configId
      ? await ProxyConfig.findOne({
          _id: parsed.configId,
          team_id: context.team._id,
          domain_id: domain._id,
        })
      : await ProxyConfig.findOne({
          team_id: context.team._id,
          domain_id: domain._id,
          subdomain: scopeSubdomain,
          name: parsed.name ?? defaultPoolName(scopeSubdomain),
        });

    if (parsed.configId && !config) {
      throw new DomainError("Route not found.");
    }

    if (!config) {
      config = new ProxyConfig({
        team_id: context.team._id,
        domain_id: domain._id,
        name: parsed.name ?? defaultPoolName(scopeSubdomain),
        subdomain: scopeSubdomain,
      });
    }

    config.name = parsed.name ?? config.name;
    config.upstream_servers = upstreams.map((url) => ({
      url,
      weight: 1,
      max_fails: 3,
      fail_timeout: 30,
      backup: false,
      down: false,
      health_status: "unknown" as const,
    }));
    config.preserve_host = parsed.preserve_host;
    config.websocket_enabled = parsed.websocket_enabled;
    config.enabled = parsed.enabled;
    config.health_check = {
      enabled: true,
      interval: config.health_check?.interval ?? 30,
      timeout: config.health_check?.timeout ?? 5,
      path: normalizedHealthPath,
      expected_status: config.health_check?.expected_status ?? 200,
      fall: config.health_check?.fall ?? 3,
      rise: config.health_check?.rise ?? 2,
    };

    await config.save();

    // Keep the plain origin in sync: agents fall back to it when no pool
    // matches, and the dashboard displays it as the scope's target.
    const primary = upstreams[0] ?? "";
    if (scopeSubdomain) {
      const target = domain.subdomains.find(
        (entry) => entry.subdomain === scopeSubdomain,
      );
      if (target) {
        target.target_url = primary;
        target.updated_at = new Date();
        domain.markModified("subdomains");
        await domain.save();
      }
    } else if (domain.target_url !== primary) {
      domain.target_url = primary;
      await domain.save();
    }

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { configId: String(config._id) } };
  } catch (error) {
    return toActionResult(error, "Could not save the route.");
  }
}

function defaultPoolName(subdomain: string | null): string {
  return subdomain ? `${subdomain} pool` : "default pool";
}

export async function deleteProxyConfigAction(input: {
  teamSlug: string;
  domainId: string;
  configId: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    const parsed = z
      .object({
        teamSlug: z.string().min(1),
        domainId: z.string().min(1),
        configId: z.string().min(1),
      })
      .parse(input);

    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const config = await ProxyConfig.findOneAndDelete({
      _id: parsed.configId,
      team_id: context.team._id,
      domain_id: parsed.domainId,
    });

    if (!config) throw new DomainError("Route not found.");

    const domain = await Domain.findOne({
      _id: parsed.domainId,
      team_id: context.team._id,
    })
      .select("domain")
      .lean<{ domain: string }>();

    if (domain) revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the route.");
  }
}
