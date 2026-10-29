/**
 * Domain and origin validation.
 *
 * Pure functions, no network access: syntax-only validation keeps the create
 * flow fast and deterministic. (The previous implementation fetched the IANA
 * TLD list on every request path; the syntax rules below already reject the
 * malformed inputs that check caught, without the latency or the failure
 * mode when the list is unreachable.)
 */

const DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SUBDOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export const LOCAL_DEVELOPMENT_SUFFIXES = [
  "localhost",
  "test",
  "example",
  "invalid",
  "local",
  "internal",
  "home.arpa",
] as const;

export type DomainValidationResult =
  | { valid: true; domain: string; kind: "public" | "local" }
  | { valid: false; message: string };

/** Strips scheme, credentials, path, query, fragment and port from user input. */
export function sanitizeDomainInput(input: string): string {
  let domain = (input ?? "").trim().toLowerCase();
  if (!domain) return "";

  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  domain = domain.replace(/^\/+/, "");

  if (domain.includes("@")) {
    const parts = domain.split("@");
    domain = parts[parts.length - 1] ?? "";
  }

  domain = domain.split("/")[0] ?? "";
  domain = domain.split("?")[0] ?? "";
  domain = domain.split("#")[0] ?? "";

  if (domain.startsWith("[") && domain.endsWith("]")) {
    domain = domain.slice(1, -1);
  }

  const colon = domain.lastIndexOf(":");
  if (colon > -1 && domain.indexOf(":") === colon) {
    const maybePort = domain.slice(colon + 1);
    if (/^\d+$/.test(maybePort)) domain = domain.slice(0, colon);
  }

  return domain.replace(/\.+$/, "").trim();
}

export function isLocalDevelopmentDomain(domain: string): boolean {
  const normalized = sanitizeDomainInput(domain);
  if (!normalized) return false;
  if (normalized === "localhost") return true;
  return LOCAL_DEVELOPMENT_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

/** Validates a domain after sanitization (lowercase, no trailing dot). */
export function validateDomain(domain: string): DomainValidationResult {
  const sanitized = sanitizeDomainInput(domain);

  if (!sanitized) {
    return { valid: false, message: "Enter a domain name." };
  }

  if (sanitized.length > 253) {
    return { valid: false, message: "Domain names cannot exceed 253 characters." };
  }

  const kind = isLocalDevelopmentDomain(sanitized) ? "local" : "public";

  if (kind === "local") {
    if (!/^[a-z0-9.-]+$/.test(sanitized)) {
      return { valid: false, message: "Local domains may only use letters, digits, dots and hyphens." };
    }
    return { valid: true, domain: sanitized, kind };
  }

  if (IPV4_REGEX.test(sanitized)) {
    const octets = sanitized.split(".").map(Number);
    if (octets.some((value) => value < 0 || value > 255)) {
      return { valid: false, message: "That IPv4 address is out of range." };
    }
    return { valid: true, domain: sanitized, kind };
  }

  if (!sanitized.includes(".")) {
    return {
      valid: false,
      message: "Include the full domain including its TLD, for example example.com.",
    };
  }

  const labels = sanitized.split(".");
  for (const label of labels) {
    if (!DOMAIN_LABEL_REGEX.test(label)) {
      return {
        valid: false,
        message: `"${label}" is not a valid domain label.`,
      };
    }
  }

  const tld = labels[labels.length - 1] ?? "";
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return { valid: false, message: "The domain needs a valid TLD, for example .com or .dev." };
  }

  return { valid: true, domain: sanitized, kind };
}

export function validateSubdomainLabel(label: string): boolean {
  const sanitized = sanitizeSubdomainLabel(label);
  return sanitized.length > 0 && sanitized.length <= 63 && SUBDOMAIN_LABEL_REGEX.test(sanitized);
}

export function sanitizeSubdomainLabel(input: string): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

/* -------------------------------------------------------------------------- */
/* Origin URLs                                                                 */
/* -------------------------------------------------------------------------- */

export type OriginValidationResult =
  | { valid: true; origin: string }
  | { valid: false; message: string };

/**
 * Validates an upstream origin: http(s) only, no embedded credentials, no
 * query/fragment, and a sane host.
 */
export function validateOriginUrl(input: string): OriginValidationResult {
  const raw = (input ?? "").trim();
  if (!raw) {
    return { valid: false, message: "Enter the origin the proxy should forward to." };
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
  } catch {
    return { valid: false, message: "That origin URL is not valid." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, message: "Origins must use http:// or https://." };
  }

  if (url.username || url.password) {
    return { valid: false, message: "Origin URLs cannot include credentials." };
  }

  if (url.search || url.hash) {
    return { valid: false, message: "Origin URLs cannot include a query string or fragment." };
  }

  if (!url.hostname) {
    return { valid: false, message: "Origin URLs need a hostname." };
  }

  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return { valid: true, origin: `${url.protocol}//${url.host}${path}` };
}
