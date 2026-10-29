import { cache } from "react";

import dbConnect from "@/lib/mongoose";
import DNSRecord, { type DNSRecordDocument } from "@/models/DNSRecord";

/** Lists the active DNS records for one domain, newest first. */
export async function listDomainDNSRecords(
  teamId: string,
  domainId: string,
): Promise<DNSRecordDocument[]> {
  await dbConnect();
  return DNSRecord.find({ team_id: teamId, domain_id: domainId, active: true })
    .sort({ created_at: -1 })
    .lean<DNSRecordDocument[]>();
}

/** Per-request cached lookup used by detail pages and actions. */
export const findDNSRecordById = cache(
  async (teamId: string, id: string): Promise<DNSRecordDocument | null> => {
    await dbConnect();
    return DNSRecord.findOne({ _id: id, team_id: teamId }).lean<DNSRecordDocument>();
  },
);
