/**
 * DNS record validation. Pure, dependency-free and safe to import from client
 * components.
 */

import { DNS_RECORD_TYPES, type DNSRecordType } from "@/models/DNSRecord";

export const MAX_TXT_LENGTH = 2048;
export const MAX_DNS_NAME_LENGTH = 253;
export const DNS_LABEL_REGEX = /^[a-z0-9_](?:[a-z0-9_.-]{0,61}[a-z0-9_])?$/i;

export function isDNSRecordType(value: unknown): value is DNSRecordType {
  return (DNS_RECORD_TYPES as readonly string[]).includes(value as string);
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255 && String(octet) === part;
  });
}

function isIpv6(value: string): boolean {
  if (!value.includes(":") || value.includes(".")) return false;
  if (value.startsWith(":") && !value.startsWith("::")) return false;
  if (value.endsWith(":") && !value.endsWith("::")) return false;
  if (value.split("::").length > 2) return false;

  const groups = value.split(":").filter((group) => group.length > 0);
  if (value.includes("::")) {
    if (groups.length > 7) return false;
  } else if (groups.length !== 8) {
    return false;
  }
  return groups.every((group) => /^[0-9a-f]{1,4}$/.test(group));
}

function isHostname(value: string): boolean {
  if (!value || value.length > MAX_DNS_NAME_LENGTH) return false;
  if (value.endsWith(".")) return isHostname(value.slice(0, -1));
  if (value === "@") return true;
  if (value.includes("..")) return false;
  return value.split(".").every((label) => DNS_LABEL_REGEX.test(label));
}

/* -------------------------------------------------------------------------- */
/* Record names                                                               */
/* -------------------------------------------------------------------------- */

/** "@" for the apex, otherwise a label (underscores allowed for TXT etc.). */
export function validateDNSRecordName(name: string): {
  valid: boolean;
  name: string;
  message?: string;
} {
  const trimmed = (name ?? "").trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, name: "", message: "Enter a record name — use @ for the apex." };
  }

  if (trimmed === "@") return { valid: true, name: "@" };

  if (trimmed.length > MAX_DNS_NAME_LENGTH) {
    return {
      valid: false,
      name: trimmed,
      message: "Record names cannot exceed 253 characters.",
    };
  }

  if (trimmed.includes("..")) {
    return { valid: false, name: trimmed, message: "Record names cannot contain empty labels." };
  }

  if (!trimmed.split(".").every((label) => DNS_LABEL_REGEX.test(label))) {
    return {
      valid: false,
      name: trimmed,
      message: "Use letters, digits, hyphens and underscores only.",
    };
  }

  return { valid: true, name: trimmed };
}

/* -------------------------------------------------------------------------- */
/* Record values                                                              */
/* -------------------------------------------------------------------------- */

export type DNSValueValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

export function validateDNSRecordValue(
  type: DNSRecordType,
  rawValue: string,
): DNSValueValidationResult {
  const value = (rawValue ?? "").trim();

  if (!value) return { valid: false, message: "Enter the record value." };

  switch (type) {
    case "A":
      return isIpv4(value)
        ? { valid: true, value }
        : { valid: false, message: "A records need a valid IPv4 address." };

    case "AAAA":
      return isIpv6(value)
        ? { valid: true, value: value.toLowerCase() }
        : { valid: false, message: "AAAA records need a valid IPv6 address." };

    case "CNAME":
    case "NS":
      return isHostname(value)
        ? { valid: true, value: value.toLowerCase() }
        : { valid: false, message: `${type} records need a hostname.` };

    case "MX":
      return isHostname(value)
        ? { valid: true, value: value.toLowerCase() }
        : { valid: false, message: "MX records need a mail server hostname." };

    case "TXT":
      if (value.length > MAX_TXT_LENGTH) {
        return {
          valid: false,
          message: `TXT values are limited to ${MAX_TXT_LENGTH} characters.`,
        };
      }
      return { valid: true, value };

    case "SRV": {
      const parts = value.split(/\s+/);
      if (
        parts.length !== 4 ||
        !/^\d{1,5}$/.test(parts[0] ?? "") ||
        !/^\d{1,5}$/.test(parts[1] ?? "") ||
        !/^\d{1,5}$/.test(parts[2] ?? "") ||
        !isHostname(parts[3] ?? "")
      ) {
        return {
          valid: false,
          message: 'SRV values use "priority weight port target", e.g. "10 5 443 origin.example.com".',
        };
      }
      const port = Number(parts[2]);
      if (port > 65535) {
        return { valid: false, message: "SRV ports must be between 0 and 65535." };
      }
      return { valid: true, value: parts.join(" ") };
    }

    case "CAA":
      if (value.length > 512) {
        return { valid: false, message: "CAA values are limited to 512 characters." };
      }
      return { valid: true, value };

    default:
      return { valid: false, message: "Unsupported record type." };
  }
}

/** Fully-qualified lookup name for a record on a domain. */
export function toLookupName(domain: string, recordName: string): string {
  return recordName === "@" || recordName === ""
    ? domain
    : `${recordName}.${domain}`;
}
