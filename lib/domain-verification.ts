import crypto from "node:crypto";
import dns from "node:dns";
import { promisify } from "node:util";

const resolveTxt = promisify(dns.resolveTxt);

export const DOMAIN_VERIFICATION_RECORD_NAME = "_netgoat-verify";

/** Generates the TXT value a domain owner must publish. */
export function createVerificationToken(): string {
  return `netgoat-verify-${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Checks whether the verification TXT record exists for a domain.
 * DNS failures resolve to `false` rather than throwing — "not yet visible"
 * and "lookup failed" both mean "try again later" from the user's side.
 */
export async function hasVerificationToken(
  domain: string,
  token: string,
): Promise<boolean> {
  try {
    const records = await resolveTxt(
      `${DOMAIN_VERIFICATION_RECORD_NAME}.${domain}`,
    );
    return records
      .map((chunks) => chunks.join(""))
      .some((value) => value.trim() === token);
  } catch {
    return false;
  }
}
