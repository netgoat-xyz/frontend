"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import {
  createVerificationToken,
  DOMAIN_VERIFICATION_RECORD_NAME,
  hasVerificationToken,
} from "@/lib/domain-verification";
import { validateDomain, validateOriginUrl } from "@/lib/validation/domain";
import DNSRecord from "@/models/DNSRecord";
import Domain from "@/models/Domain";
import ProxyConfig from "@/models/ProxyConfig";
import Team from "@/models/Team";

export type DomainVerification = {
  recordName: string;
  recordType: "TXT";
  recordValue: string;
};

const createDomainSchema = z.object({
  teamSlug: z.string().min(1),
  domain: z.string().min(1, "Enter a domain name."),
  target_url: z.string().min(1, "Enter the origin this domain should serve."),
  dns_enabled: z.boolean().default(true),
});

export async function createDomainAction(input: {
  teamSlug: string;
  domain: string;
  target_url: string;
  dns_enabled?: boolean;
}): Promise<
  ActionResult<{ domainId: string; domain: string; verification: DomainVerification | null }>
> {
  try {
    const parsed = createDomainSchema.parse(input);
    const { team } = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    if (team.domain_count >= team.max_domains) {
      throw new DomainError(
        `This team has reached its ${team.max_domains}-domain limit.`,
      );
    }

    const domainValidation = validateDomain(parsed.domain);
    if (!domainValidation.valid) {
      throw new DomainError(domainValidation.message);
    }

    const originValidation = validateOriginUrl(parsed.target_url);
    if (!originValidation.valid) {
      throw new DomainError(originValidation.message);
    }

    const existing = await Domain.findOne({
      team_id: team._id,
      domain: domainValidation.domain,
    })
      .select({ _id: 1 })
      .lean();

    if (existing) {
      throw new DomainError("That domain is already attached to this team.");
    }

    const verificationToken = createVerificationToken();
    const isLocal = domainValidation.kind === "local";
    const verified = isLocal
      ? true
      : await hasVerificationToken(domainValidation.domain, verificationToken);

    const domain = await Domain.create({
      team_id: team._id,
      domain: domainValidation.domain,
      target_url: originValidation.origin,
      active: true,
      dns_enabled: parsed.dns_enabled,
      verified,
      verification_token: verificationToken,
      verification_attempts: 0,
      next_verification_check: isLocal
        ? null
        : new Date(Date.now() + 30 * 60 * 1000),
    });

    await Team.updateOne(
      { _id: team._id },
      { $inc: { domain_count: 1 }, $set: { updated_at: new Date() } },
    );

    revalidatePath(`/dashboard/${team.slug}`, "layout");

    return {
      ok: true,
      data: {
        domainId: String(domain._id),
        domain: domain.domain,
        verification: verified
          ? null
          : {
              recordName: DOMAIN_VERIFICATION_RECORD_NAME,
              recordType: "TXT",
              recordValue: verificationToken,
            },
      },
    };
  } catch (error) {
    return toActionResult(error, "Could not add the domain.");
  }
}

const verifyDomainSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
});

export async function verifyDomainAction(input: {
  teamSlug: string;
  domainId: string;
}): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const parsed = verifyDomainSchema.parse(input);
    const { team } = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const domain = await Domain.findOne({
      _id: parsed.domainId,
      team_id: team._id,
    });

    if (!domain) throw new DomainError("Domain not found.");

    if (domain.verified) {
      return { ok: true, data: { verified: true } };
    }

    const token = domain.verification_token;
    if (!token) throw new DomainError("This domain has no verification token.");

    const verified = await hasVerificationToken(domain.domain, token);

    domain.verification_attempts += 1;
    domain.last_verification_check = new Date();
    domain.verified = verified;
    if (verified) domain.verification_token = undefined;
    await domain.save();

    revalidatePath(`/dashboard/${team.slug}`, "layout");
    return { ok: true, data: { verified } };
  } catch (error) {
    return toActionResult(error, "Could not check domain verification.");
  }
}

const toggleDomainSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  active: z.boolean(),
});

export async function setDomainActiveAction(input: {
  teamSlug: string;
  domainId: string;
  active: boolean;
}): Promise<ActionResult<{ active: boolean }>> {
  try {
    const parsed = toggleDomainSchema.parse(input);
    const { team } = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const result = await Domain.updateOne(
      { _id: parsed.domainId, team_id: team._id },
      { $set: { active: parsed.active, updated_at: new Date() } },
    );

    if (result.matchedCount === 0) throw new DomainError("Domain not found.");

    revalidatePath(`/dashboard/${team.slug}`, "layout");
    return { ok: true, data: { active: parsed.active } };
  } catch (error) {
    return toActionResult(error, "Could not update the domain.");
  }
}

const deleteDomainSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
});

export async function deleteDomainAction(input: {
  teamSlug: string;
  domainId: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    const parsed = deleteDomainSchema.parse(input);
    const { team } = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const deleted = await Domain.findOneAndDelete({
      _id: parsed.domainId,
      team_id: team._id,
    });

    if (!deleted) throw new DomainError("Domain not found.");

    await Promise.all([
      Team.updateOne(
        { _id: team._id, domain_count: { $gt: 0 } },
        { $inc: { domain_count: -1 }, $set: { updated_at: new Date() } },
      ),
      // Orphaned DNS records and proxy configs would otherwise keep the agent
      // streaming a domain that no longer exists.
      DNSRecord.deleteMany({ team_id: team._id, domain_id: deleted._id }),
      ProxyConfig.deleteMany({ team_id: team._id, domain_id: deleted._id }),
    ]);

    revalidatePath(`/dashboard/${team.slug}`, "layout");
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the domain.");
  }
}
