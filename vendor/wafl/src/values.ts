/** Canonical IP, CIDR, and duration value handling. */

export type IpBytes = Uint8Array;

export interface Cidr {
  bytes: IpBytes;
  prefix: number;
}

export function parseIpv4(input: string): IpBytes | null {
  const parts = input.split(".");
  if (parts.length !== 4) return null;
  const out = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    const part = parts[i]!;
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    out[i] = n;
  }
  return out;
}

const HEX_GROUP = /^[0-9A-Fa-f]{1,4}$/;

export function parseIpv6(input: string): IpBytes | null {
  if (!input.includes(":")) return null;
  if (input.includes("%")) return null; // zone identifiers are not policy-relevant

  const doubleColon = input.split("::");
  if (doubleColon.length > 2) return null;

  let groups: string[];
  if (doubleColon.length === 2) {
    const left = doubleColon[0] === "" ? [] : doubleColon[0]!.split(":");
    const right = doubleColon[1] === "" ? [] : doubleColon[1]!.split(":");
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    groups = [...left, ...new Array<string>(missing).fill("0"), ...right];
  } else {
    groups = input.split(":");
    if (groups.length !== 8) return null;
  }

  if (groups.length !== 8) return null;

  // Embedded IPv4 tail, e.g. ::ffff:192.168.1.1
  const last = groups[7]!;
  if (last.includes(".")) {
    const v4 = parseIpv4(last);
    if (!v4) return null;
    groups = [
      ...groups.slice(0, 7),
      (((v4[0]! << 8) | v4[1]!) >>> 0).toString(16),
      (((v4[2]! << 8) | v4[3]!) >>> 0).toString(16),
    ];
  }

  if (!groups.every((g) => HEX_GROUP.test(g))) return null;

  const out = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    const value = parseInt(groups[i]!, 16);
    out[i * 2] = (value >> 8) & 0xff;
    out[i * 2 + 1] = value & 0xff;
  }
  return out;
}

export function parseIp(input: string): IpBytes | null {
  return parseIpv4(input) ?? parseIpv6(input);
}

export function parseCidr(input: string): Cidr | null {
  const slash = input.lastIndexOf("/");
  if (slash < 0) return null;
  const bytes = parseIp(input.slice(0, slash));
  if (!bytes) return null;
  const prefixText = input.slice(slash + 1);
  if (!/^\d{1,3}$/.test(prefixText)) return null;
  const prefix = Number(prefixText);
  if (prefix > bytes.length * 8) return null;
  return { bytes, prefix };
}

export function ipInCidr(ip: IpBytes, cidr: Cidr): boolean {
  if (ip.length !== cidr.bytes.length) return false;
  let bits = cidr.prefix;
  for (let i = 0; bits > 0; i++) {
    const take = Math.min(8, bits);
    const mask = take === 8 ? 0xff : ((0xff << (8 - take)) & 0xff);
    if ((ip[i]! & mask) !== (cidr.bytes[i]! & mask)) return false;
    bits -= take;
  }
  return true;
}

export function formatIp(bytes: IpBytes): string {
  if (bytes.length === 4) return Array.from(bytes).join(".");
  if (bytes.length !== 16) return "";

  const groups: number[] = [];
  for (let i = 0; i < 16; i += 2) groups.push((bytes[i]! << 8) | bytes[i + 1]!);

  // RFC 5952: compress the longest run of at least two zero groups.
  let bestStart = -1;
  let bestLength = 1;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }

  const hex = groups.map((g) => g.toString(16));
  if (bestStart < 0) return hex.join(":");
  const head = hex.slice(0, bestStart).join(":");
  const tail = hex.slice(bestStart + bestLength).join(":");
  return `${head}::${tail}`;
}

export function formatCidr(cidr: Cidr): string {
  return `${formatIp(cidr.bytes)}/${cidr.prefix}`;
}

const DURATION_UNITS: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses `500ms`, `30s`, `5m`, `1h`, `1d` into milliseconds. */
export function parseDuration(input: string): number | null {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = DURATION_UNITS[match[2]!]!;
  const ms = amount * unit;
  return Number.isSafeInteger(ms) ? ms : null;
}

export function formatDuration(ms: number): string {
  for (const unit of ["d", "h", "m", "s"] as const) {
    const size = DURATION_UNITS[unit]!;
    if (ms >= size && ms % size === 0) return `${ms / size}${unit}`;
  }
  return `${ms}ms`;
}
