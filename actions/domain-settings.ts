"use server";

import { revalidatePath } from "next/cache";
import type { HydratedDocument } from "mongoose";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess, type TeamContext } from "@/lib/auth-guards";
import {
  normalizeAccessControl,
  normalizePemMaterial,
  normalizeRoutePolicy,
  normalizeWafRule,
  type AccessMode,
} from "@/lib/control-plane";
import dbConnect from "@/lib/mongoose";
import { validateOriginUrl } from "@/lib/validation/domain";
import Domain, { type DomainDocument } from "@/models/Domain";

type DomainLookup = {
  context: TeamContext;
  domain: HydratedDocument<DomainDocument>;
};

async function requireDomain(
  teamSlug: string,
  domainId: string,
  capability: "domains.manage" | "security.manage" = "domains.manage",
): Promise<DomainLookup> {
  const context = await assertTeamAccess(teamSlug, capability);
  await dbConnect();

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: context.team._id,
  });

  if (!domain) throw new DomainError("Domain not found.");

  return { context, domain };
}

function revalidateDomain(teamSlug: string, domainName: string) {
  revalidatePath(`/dashboard/${teamSlug}/${domainName}`, "layout");
}

/* -------------------------------------------------------------------------- */
/* Origin                                                                     */
/* -------------------------------------------------------------------------- */

const originSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  subdomain: z.string().min(1).max(63).optional(),
  target_url: z.string().min(1, "Enter the origin URL."),
});

export async function updateDomainOriginAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  target_url: string;
}): Promise<ActionResult<{ origin: string }>> {
  try {
    const parsed = originSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
    );

    const validation = validateOriginUrl(parsed.target_url);
    if (!validation.valid) throw new DomainError(validation.message);

    if (parsed.subdomain) {
      const target = domain.subdomains.find(
        (entry) => entry.subdomain === parsed.subdomain,
      );
      if (!target) throw new DomainError("Subdomain not found.");
      target.target_url = validation.origin;
      target.updated_at = new Date();
      domain.markModified("subdomains");
    } else {
      domain.target_url = validation.origin;
    }

    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { origin: validation.origin } };
  } catch (error) {
    return toActionResult(error, "Could not update the origin.");
  }
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

const settingsSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  rate_limit: z.number().int().min(1).max(1_000_000).optional(),
  cache_enabled: z.boolean().optional(),
  cache_ttl: z.number().int().min(0).max(86_400).optional(),
  compression_enabled: z.boolean().optional(),
  log_level: z.enum(["none", "errors", "all"]).optional(),
});

export async function updateDomainSettingsAction(input: {
  teamSlug: string;
  domainId: string;
  rate_limit?: number;
  cache_enabled?: boolean;
  cache_ttl?: number;
  compression_enabled?: boolean;
  log_level?: "none" | "errors" | "all";
}): Promise<ActionResult<{ updated: true }>> {
  try {
    const parsed = settingsSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
    );

    const updates: Record<string, unknown> = {};
    for (const key of [
      "rate_limit",
      "cache_enabled",
      "cache_ttl",
      "compression_enabled",
      "log_level",
    ] as const) {
      const value = parsed[key];
      if (value !== undefined) updates[`settings.${key}`] = value;
    }

    if (Object.keys(updates).length === 0) {
      return { ok: true, data: { updated: true } };
    }

    await Domain.updateOne(
      { _id: domain._id },
      { $set: { ...updates, updated_at: new Date() } },
    );

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { updated: true } };
  } catch (error) {
    return toActionResult(error, "Could not update the settings.");
  }
}

const routePolicySchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  route_policy: z.unknown(),
});

export async function updateDomainRoutePolicyAction(input: {
  teamSlug: string;
  domainId: string;
  route_policy: unknown;
}): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    const parsed = routePolicySchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
    );

    const policy = normalizeRoutePolicy(parsed.route_policy);

    await Domain.updateOne(
      { _id: domain._id },
      policy
        ? { $set: { route_policy: policy, updated_at: new Date() } }
        : { $unset: { route_policy: "" }, $set: { updated_at: new Date() } },
    );

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { cleared: policy === null } };
  } catch (error) {
    return toActionResult(error, "Could not update the route policy.");
  }
}

/* -------------------------------------------------------------------------- */
/* SSL                                                                        */
/* -------------------------------------------------------------------------- */

const sslSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  subdomain: z.string().min(1).max(63).optional(),
  auto_ssl: z.boolean(),
  certificate_pem: z.string().max(65_536).optional(),
  private_key_pem: z.string().max(65_536).optional(),
  clear_manual_ssl: z.boolean().default(false),
});

export async function updateDomainSslAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  auto_ssl: boolean;
  certificate_pem?: string;
  private_key_pem?: string;
  clear_manual_ssl?: boolean;
}): Promise<ActionResult<{ ssl_enabled: boolean }>> {
  try {
    const parsed = sslSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
      "security.manage",
    );

    if (parsed.subdomain) {
      const target = domain.subdomains.find(
        (entry) => entry.subdomain === parsed.subdomain,
      );
      if (!target) throw new DomainError("Subdomain not found.");

      if (parsed.clear_manual_ssl) {
        target.certificate_pem = undefined;
        target.private_key_pem = undefined;
      } else if (parsed.certificate_pem || parsed.private_key_pem) {
        const pem = normalizePemMaterial(
          parsed.certificate_pem,
          parsed.private_key_pem,
        );
        target.certificate_pem = pem.certificate_pem ?? undefined;
        target.private_key_pem = pem.private_key_pem ?? undefined;
      }

      target.updated_at = new Date();
      domain.markModified("subdomains");
      await domain.save();

      revalidateDomain(context.team.slug, domain.domain);
      return { ok: true, data: { ssl_enabled: Boolean(target.certificate_pem) } };
    }

    if (parsed.clear_manual_ssl) {
      domain.certificate_pem = undefined;
      domain.private_key_pem = undefined;
      domain.ssl_enabled = false;
    } else if (parsed.certificate_pem || parsed.private_key_pem) {
      const pem = normalizePemMaterial(
        parsed.certificate_pem,
        parsed.private_key_pem,
      );
      domain.certificate_pem = pem.certificate_pem ?? undefined;
      domain.private_key_pem = pem.private_key_pem ?? undefined;
      domain.ssl_enabled = pem.ssl_enabled;
    }

    domain.auto_ssl = parsed.auto_ssl;
    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { ssl_enabled: domain.ssl_enabled } };
  } catch (error) {
    return toActionResult(error, "Could not update the SSL configuration.");
  }
}

/* -------------------------------------------------------------------------- */
/* WAF rules                                                                  */
/* -------------------------------------------------------------------------- */

const wafAddSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  subdomain: z.string().min(1).max(63).optional(),
  rule: z.object({
    name: z.string(),
    expression: z.string(),
    action: z.enum(["BLOCK", "ALLOW", "LOG"]).optional(),
    priority: z.number().int().min(0).max(100_000).optional(),
    enabled: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

export async function addWafRuleAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  rule: {
    name: string;
    expression: string;
    action?: "BLOCK" | "ALLOW" | "LOG";
    priority?: number;
    enabled?: boolean;
    description?: string;
  };
}): Promise<ActionResult<{ name: string }>> {
  try {
    const parsed = wafAddSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
    );

    const rule = normalizeWafRule(parsed.rule);

    const collection = parsed.subdomain
      ? domain.subdomains.find((entry) => entry.subdomain === parsed.subdomain)
          ?.waf_rules
      : domain.waf_rules;

    if (!collection) throw new DomainError("Subdomain not found.");

    if (collection.some((existing) => existing.name === rule.name)) {
      throw new DomainError(`A rule named “${rule.name}” already exists.`);
    }

    collection.push(rule);
    if (parsed.subdomain) domain.markModified("subdomains");
    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { name: rule.name } };
  } catch (error) {
    return toActionResult(error, "Could not add the WAF rule.");
  }
}

const wafRemoveSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  subdomain: z.string().min(1).max(63).optional(),
  ruleName: z.string().min(1),
});

export async function removeWafRuleAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  ruleName: string;
}): Promise<ActionResult<{ removed: true }>> {
  try {
    const parsed = wafRemoveSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
    );

    if (parsed.subdomain) {
      const target = domain.subdomains.find(
        (entry) => entry.subdomain === parsed.subdomain,
      );
      if (!target) throw new DomainError("Subdomain not found.");
      target.waf_rules = target.waf_rules.filter(
        (rule) => rule.name !== parsed.ruleName,
      );
      domain.markModified("subdomains");
    } else {
      domain.waf_rules = domain.waf_rules.filter(
        (rule) => rule.name !== parsed.ruleName,
      );
    }

    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { removed: true } };
  } catch (error) {
    return toActionResult(error, "Could not remove the WAF rule.");
  }
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

const accessSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  subdomain: z.string().min(1).max(63).optional(),
  mode: z.enum(["off", "allowlist", "blocklist", "inherit"]),
  cidrs: z.array(z.string()).max(512),
});

export async function updateAccessControlAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  mode: AccessMode;
  cidrs: string[];
}): Promise<ActionResult<{ mode: AccessMode; cidrs: string[] }>> {
  try {
    const parsed = accessSchema.parse(input);
    const { context, domain } = await requireDomain(
      parsed.teamSlug,
      parsed.domainId,
      "security.manage",
    );

    const normalized = normalizeAccessControl(
      { mode: parsed.mode, cidrs: parsed.cidrs },
      { allowInherit: Boolean(parsed.subdomain) },
    );

    if (parsed.subdomain) {
      const target = domain.subdomains.find(
        (entry) => entry.subdomain === parsed.subdomain,
      );
      if (!target) throw new DomainError("Subdomain not found.");
      target.access_control = normalized;
      target.updated_at = new Date();
      domain.markModified("subdomains");
    } else {
      domain.access_control = normalized;
    }

    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: normalized };
  } catch (error) {
    return toActionResult(error, "Could not update the access rules.");
  }
}
