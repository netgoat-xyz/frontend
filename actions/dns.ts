"use server";

import {
  resolve4,
  resolve6,
  resolveCaa,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveSrv,
  resolveTxt,
} from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess } from "@/lib/auth-guards";
import {
  toLookupName,
  validateDNSRecordName,
  validateDNSRecordValue,
} from "@/lib/validation/dns";
import dbConnect from "@/lib/mongoose";
import DNSRecord, { type DNSRecordDocument, type DNSRecordType } from "@/models/DNSRecord";
import Domain from "@/models/Domain";

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"] as const;

async function requireDomainRecord(
  teamSlug: string,
  domainId: string,
): Promise<{
  teamId: string;
  teamSlug: string;
  domainName: string;
  domainObjectId: string;
  userId: string;
}> {
  const context = await assertTeamAccess(teamSlug, "domains.manage");
  await dbConnect();

  const domain = await Domain.findOne({ _id: domainId, team_id: context.team._id })
    .select("domain")
    .lean<{ _id: unknown; domain: string }>();

  if (!domain) throw new DomainError("Domain not found.");

  return {
    teamId: String(context.team._id),
    teamSlug: context.team.slug,
    domainName: domain.domain,
    domainObjectId: String(domain._id),
    userId: context.user.id,
  };
}

function revalidateDomain(teamSlug: string, domainName: string) {
  revalidatePath(`/dashboard/${teamSlug}/${domainName}`, "layout");
}

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

const createSchema = z.object({
  teamSlug: z.string().min(1),
  domainId: z.string().min(1),
  type: z.enum(DNS_TYPES),
  name: z.string().min(1),
  value: z.string().min(1),
  ttl: z.number().int().min(60).max(86_400).default(3600),
  priority: z.number().int().min(0).max(65_535).optional(),
  proxied: z.boolean().default(false),
});

export async function createDNSRecordAction(input: {
  teamSlug: string;
  domainId: string;
  type: DNSRecordType;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}): Promise<ActionResult<{ recordId: string }>> {
  try {
    const parsed = createSchema.parse(input);
    const scope = await requireDomainRecord(parsed.teamSlug, parsed.domainId);

    const name = validateDNSRecordName(parsed.name);
    if (!name.valid) throw new DomainError(name.message ?? "Invalid record name.");

    const value = validateDNSRecordValue(parsed.type, parsed.value);
    if (!value.valid) throw new DomainError(value.message);

    const existing = await DNSRecord.findOne({
      team_id: scope.teamId,
      domain_id: scope.domainObjectId,
      type: parsed.type,
      name: name.name,
      value: value.value,
      active: true,
    }).lean();

    if (existing) {
      throw new DomainError("An identical record already exists.");
    }

    const record = await DNSRecord.create({
      team_id: scope.teamId,
      domain_id: scope.domainObjectId,
      domain: scope.domainName,
      type: parsed.type,
      name: name.name,
      value: value.value,
      ttl: parsed.ttl,
      priority: parsed.priority,
      proxied: parsed.proxied,
      active: true,
      propagated: false,
      created_by: scope.userId,
    });

    revalidateDomain(scope.teamSlug, scope.domainName);
    return { ok: true, data: { recordId: String(record._id) } };
  } catch (error) {
    return toActionResult(error, "Could not create the DNS record.");
  }
}

/* -------------------------------------------------------------------------- */
/* Update                                                                     */
/* -------------------------------------------------------------------------- */

const updateSchema = z.object({
  teamSlug: z.string().min(1),
  recordId: z.string().min(1),
  value: z.string().optional(),
  ttl: z.number().int().min(60).max(86_400).optional(),
  priority: z.number().int().min(0).max(65_535).optional(),
  proxied: z.boolean().optional(),
});

export async function updateDNSRecordAction(input: {
  teamSlug: string;
  recordId: string;
  value?: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}): Promise<ActionResult<{ updated: true }>> {
  try {
    const parsed = updateSchema.parse(input);
    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const record = await DNSRecord.findOne({
      _id: parsed.recordId,
      team_id: context.team._id,
      active: true,
    });

    if (!record) throw new DomainError("DNS record not found.");

    if (parsed.value !== undefined) {
      const value = validateDNSRecordValue(record.type, parsed.value);
      if (!value.valid) throw new DomainError(value.message);
      record.value = value.value;
      record.propagated = false;
    }

    if (parsed.ttl !== undefined) record.ttl = parsed.ttl;
    if (parsed.priority !== undefined) record.priority = parsed.priority;
    if (parsed.proxied !== undefined) record.proxied = parsed.proxied;

    await record.save();

    revalidateDomain(context.team.slug, record.domain);
    return { ok: true, data: { updated: true } };
  } catch (error) {
    return toActionResult(error, "Could not update the DNS record.");
  }
}

/* -------------------------------------------------------------------------- */
/* Delete                                                                     */
/* -------------------------------------------------------------------------- */

export async function deleteDNSRecordAction(input: {
  teamSlug: string;
  recordId: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    const parsed = z
      .object({ teamSlug: z.string().min(1), recordId: z.string().min(1) })
      .parse(input);

    const context = await assertTeamAccess(parsed.teamSlug, "domains.manage");
    await dbConnect();

    const record = await DNSRecord.findOneAndDelete({
      _id: parsed.recordId,
      team_id: context.team._id,
    });

    if (!record) throw new DomainError("DNS record not found.");

    revalidateDomain(context.team.slug, record.domain);
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the DNS record.");
  }
}

/* -------------------------------------------------------------------------- */
/* Propagation check                                                          */
/* -------------------------------------------------------------------------- */

const LOOKUP_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS lookup timed out.")), LOOKUP_TIMEOUT_MS),
    ),
  ]);
}

function normalizeObserved(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "").replace(/^"|"$/g, "");
}

async function lookupRecord(
  type: DNSRecordType,
  name: string,
): Promise<string[]> {
  switch (type) {
    case "A":
      return (await withTimeout(resolve4(name))).map(String);
    case "AAAA":
      return (await withTimeout(resolve6(name))).map(String);
    case "CNAME":
      return (await withTimeout(resolveCname(name))).map(String);
    case "NS":
      return (await withTimeout(resolveNs(name))).map(String);
    case "MX": {
      const entries = await withTimeout(resolveMx(name));
      return entries.map((entry) => `${entry.priority} ${entry.exchange}`);
    }
    case "TXT": {
      const entries = await withTimeout(resolveTxt(name));
      return entries.map((chunks) => chunks.join(""));
    }
    case "SRV": {
      const entries = await withTimeout(resolveSrv(name));
      return entries.map(
        (entry) => `${entry.priority} ${entry.weight} ${entry.port} ${entry.name}`,
      );
    }
    case "CAA": {
      const entries = await withTimeout(resolveCaa(name));
      return entries.map((entry) => {
        const value =
          entry.issue ?? entry.issuewild ?? entry.iodef ?? "";
        return `${entry.critical} ${value}`.trim();
      });
    }
    default:
      return [];
  }
}

export async function checkDNSPropagationAction(input: {
  teamSlug: string;
  recordId: string;
}): Promise<ActionResult<{ propagated: boolean; observed: string[] }>> {
  try {
    const parsed = z
      .object({ teamSlug: z.string().min(1), recordId: z.string().min(1) })
      .parse(input);

    const context = await assertTeamAccess(parsed.teamSlug, "domains.view");
    await dbConnect();

    const record = await DNSRecord.findOne({
      _id: parsed.recordId,
      team_id: context.team._id,
      active: true,
    }).lean<DNSRecordDocument>();

    if (!record) throw new DomainError("DNS record not found.");

    const lookupName = toLookupName(record.domain, record.name);

    let observed: string[] = [];
    try {
      observed = await lookupRecord(record.type, lookupName);
    } catch {
      observed = [];
    }

    const expected = normalizeObserved(record.value);
    const propagated = observed.some((entry) => {
      const normalized = normalizeObserved(entry);
      if (record.type === "MX" || record.type === "SRV") {
        // Compare only the hostname portion, the priority/port bits may differ
        // in formatting between providers.
        return normalized.endsWith(expected);
      }
      return normalized === expected;
    });

    await DNSRecord.updateOne(
      { _id: record._id },
      { $set: { propagated, last_checked: new Date() } },
    );

    revalidateDomain(context.team.slug, record.domain);
    return { ok: true, data: { propagated, observed } };
  } catch (error) {
    return toActionResult(error, "Could not check DNS propagation.");
  }
}
