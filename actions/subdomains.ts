"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import {
  sanitizeSubdomainLabel,
  validateOriginUrl,
  validateSubdomainLabel,
} from "@/lib/validation/domain";
import DNSRecord from "@/models/DNSRecord";
import Domain from "@/models/Domain";
import ProxyConfig from "@/models/ProxyConfig";

function revalidateDomain(teamSlug: string, domainName: string) {
  revalidatePath(`/dashboard/${teamSlug}/${domainName}`, "layout");
}

/* -------------------------------------------------------------------------- */
/* Add                                                                        */
/* -------------------------------------------------------------------------- */

export async function addSubdomainAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain: string;
  target_url: string;
}): Promise<ActionResult<{ subdomain: string; fullDomain: string }>> {
  try {
    const parsed = z
      .object({
        teamSlug: z.string().min(1),
        domainId: z.string().min(1),
        subdomain: z.string().min(1).max(63),
        target_url: z.string().min(1),
      })
      .parse(input);

    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const label = sanitizeSubdomainLabel(parsed.subdomain);
    if (!label || !validateSubdomainLabel(label)) {
      throw new DomainError(
        "Use a single label: letters, digits and hyphens only (up to 63 characters).",
      );
    }

    const origin = validateOriginUrl(parsed.target_url);
    if (!origin.valid) throw new DomainError(origin.message);

    const domain = await Domain.findOne({
      _id: parsed.domainId,
      team_id: context.team._id,
      active: true,
    });

    if (!domain) throw new DomainError("Domain not found.");

    if (domain.subdomains.some((entry) => entry.subdomain === label)) {
      throw new DomainError(`“${label}” already exists on this domain.`);
    }

    if (domain.subdomains.length >= 50) {
      throw new DomainError("Domains support up to 50 subdomains.");
    }

    const fullDomain = `${label}.${domain.domain}`;
    const now = new Date();

    domain.subdomains.push({
      subdomain: label,
      full_domain: fullDomain,
      target_url: origin.origin,
      active: true,
      access_control: { mode: "inherit", cidrs: [] },
      waf_rules: [],
      request_count: 0,
      blocked_count: 0,
      created_at: now,
      updated_at: now,
    });
    domain.markModified("subdomains");

    await domain.save();

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { subdomain: label, fullDomain } };
  } catch (error) {
    return toActionResult(error, "Could not add the subdomain.");
  }
}

/* -------------------------------------------------------------------------- */
/* Remove                                                                     */
/* -------------------------------------------------------------------------- */

export async function removeSubdomainAction(input: {
  teamSlug: string;
  domainId: string;
  subdomain: string;
}): Promise<ActionResult<{ removed: true }>> {
  try {
    const parsed = z
      .object({
        teamSlug: z.string().min(1),
        domainId: z.string().min(1),
        subdomain: z.string().min(1),
      })
      .parse(input);

    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const domain = await Domain.findOne({
      _id: parsed.domainId,
      team_id: context.team._id,
      active: true,
    });

    if (!domain) throw new DomainError("Domain not found.");

    const before = domain.subdomains.length;
    domain.subdomains = domain.subdomains.filter(
      (entry) => entry.subdomain !== parsed.subdomain,
    );

    if (domain.subdomains.length === before) {
      throw new DomainError("Subdomain not found.");
    }

    domain.markModified("subdomains");
    await domain.save();

    // Reverse proxies and DNS records for that label have no owner anymore.
    await Promise.all([
      ProxyConfig.deleteMany({ team_id: context.team._id, subdomain: parsed.subdomain }),
      DNSRecord.deleteMany({
        team_id: context.team._id,
        domain_id: domain._id,
        name: parsed.subdomain,
      }),
    ]);

    revalidateDomain(context.team.slug, domain.domain);
    return { ok: true, data: { removed: true } };
  } catch (error) {
    return toActionResult(error, "Could not remove the subdomain.");
  }
}
