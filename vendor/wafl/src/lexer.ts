import { DiagnosticBag, type Diagnostic } from "./diagnostics";
import { KEYWORDS, type Token, type TokenKind } from "./token";
import { parseCidr, parseDuration, parseIpv4, parseIpv6 } from "./values";

export const MAX_EXPRESSION_LENGTH = 8192;

const DURATION_RE = /^(\d+)(ms|s|m|h|d)(?![A-Za-z0-9_])/;
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?/;
const NUMBER_RE = /^\d+\.\d+/;
const INTEGER_RE = /^\d+/;
const IPV6_CANDIDATE_RE = /^[0-9A-Fa-f:.\/]+/;

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

function isHex(ch: string): boolean {
  return isDigit(ch) || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
}

/**
 * Tokenizes a WAFL expression or rule. The lexer never throws: malformed
 * input produces diagnostics and an `eof` token so the parser can recover.
 */
export function tokenize(source: string): { tokens: Token[]; diagnostics: Diagnostic[] } {
  const diagnostics = new DiagnosticBag();
  const tokens: Token[] = [];

  if (source.length > MAX_EXPRESSION_LENGTH) {
    diagnostics.error(
      "EXPRESSION_TOO_LONG",
      `Expression is ${source.length} characters; the limit is ${MAX_EXPRESSION_LENGTH}.`,
      { start: 0, end: source.length },
    );
  }

  let i = 0;
  const push = (kind: TokenKind, start: number, end: number, value?: Token["value"]) => {
    tokens.push({ kind, text: source.slice(start, end), start, end, ...(value !== undefined ? { value } : {}) });
  };

  while (i < source.length) {
    const ch = source[i]!;

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    // Strings -------------------------------------------------------
    if (ch === '"') {
      const start = i;
      i++;
      let value = "";
      let closed = false;
      while (i < source.length) {
        const c = source[i]!;
        if (c === '"') {
          i++;
          closed = true;
          break;
        }
        if (c === "\\") {
          const escStart = i;
          i++;
          const e = source[i];
          if (e === undefined) break;
          switch (e) {
            case '"': value += '"'; i++; break;
            case "\\": value += "\\"; i++; break;
            case "/": value += "/"; i++; break;
            case "b": value += "\b"; i++; break;
            case "f": value += "\f"; i++; break;
            case "n": value += "\n"; i++; break;
            case "r": value += "\r"; i++; break;
            case "t": value += "\t"; i++; break;
            case "u": {
              const hex = source.slice(i + 1, i + 5);
              if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
                diagnostics.error("INVALID_ESCAPE", `Invalid unicode escape \\u${hex}.`, { start: escStart, end: Math.min(i + 5, source.length) });
                i++;
                break;
              }
              value += String.fromCharCode(parseInt(hex, 16));
              i += 5;
              break;
            }
            default:
              diagnostics.error("INVALID_ESCAPE", `Unsupported escape sequence \\${e}.`, { start: escStart, end: i + 1 });
              value += e;
              i++;
              break;
          }
          continue;
        }
        value += c;
        i++;
      }
      if (!closed) {
        diagnostics.error("UNTERMINATED_STRING", "Unterminated string literal.", { start, end: source.length });
      }
      push("string", start, i, value);
      continue;
    }

    // Datasets ------------------------------------------------------
    if (ch === "$") {
      const start = i;
      i++;
      const nameStart = i;
      if (i >= source.length || !isIdentStart(source[i]!)) {
        diagnostics.error("SYNTAX_ERROR", "Expected a dataset name after '$'.", { start, end: i });
        continue;
      }
      while (i < source.length && isIdentPart(source[i]!)) i++;
      push("dataset", start, i, source.slice(nameStart, i));
      continue;
    }

    // IPv6 / IPv6 CIDR (before identifiers and numbers) ------------
    if (ch === ":" || isHex(ch)) {
      const candidate = IPV6_CANDIDATE_RE.exec(source.slice(i))?.[0] ?? "";
      if (candidate.includes(":")) {
        const slash = candidate.indexOf("/");
        const address = slash >= 0 ? candidate.slice(0, slash) : candidate;
        const bytes = parseIpv6(address);
        if (bytes) {
          if (slash >= 0) {
            const prefixText = candidate.slice(slash + 1);
            const prefix = /^\d{1,3}$/.test(prefixText) ? Number(prefixText) : NaN;
            if (!Number.isInteger(prefix) || prefix > 128) {
              diagnostics.error("INVALID_CIDR", `Invalid IPv6 CIDR '${candidate}'.`, { start: i, end: i + candidate.length });
            } else {
              push("cidr", i, i + candidate.length, candidate);
            }
          } else {
            push("ip", i, i + candidate.length, candidate);
          }
          i += candidate.length;
          continue;
        }
        if (ch === ":" || isDigit(ch)) {
          diagnostics.error("INVALID_IP", `Invalid IPv6 address '${candidate}'.`, { start: i, end: i + candidate.length });
          i += candidate.length;
          continue;
        }
      }
    }

    // Durations -----------------------------------------------------
    if (isDigit(ch)) {
      const rest = source.slice(i);
      const duration = DURATION_RE.exec(rest);
      if (duration) {
        const text = duration[0];
        const ms = parseDuration(text);
        if (ms === null) {
          diagnostics.error("INVALID_DURATION", `Duration '${text}' is out of range.`, { start: i, end: i + text.length });
        } else {
          push("duration", i, i + text.length, ms);
        }
        i += text.length;
        continue;
      }

      // IPv4 / CIDR -------------------------------------------------
      const ipv4 = IPV4_RE.exec(rest);
      if (ipv4) {
        const text = ipv4[0];
        const after = rest[text.length];
        if (after === undefined || !isIdentPart(after)) {
          const base = text.split("/")[0]!;
          const octetsOk = ipv4.slice(1, 5).every((o) => Number(o) <= 255);
          const cidrOk = ipv4[5] === undefined || Number(ipv4[5]) <= 32;
          if (parseIpv4(base) && octetsOk && cidrOk) {
            if (ipv4[5] !== undefined) {
              const parsed = parseCidr(text);
              if (parsed) push("cidr", i, i + text.length, text);
              else diagnostics.error("INVALID_CIDR", `Invalid CIDR '${text}'.`, { start: i, end: i + text.length });
            } else {
              push("ip", i, i + text.length, text);
            }
            i += text.length;
            continue;
          }
          diagnostics.error("INVALID_IP", `Invalid IPv4 address '${text}'.`, { start: i, end: i + text.length });
          i += text.length;
          continue;
        }
      }

      // Numbers -----------------------------------------------------
      const number = NUMBER_RE.exec(rest);
      if (number) {
        const text = number[0];
        push("number", i, i + text.length, Number(text));
        i += text.length;
        continue;
      }
      const integer = INTEGER_RE.exec(rest)!;
      const text = integer[0];
      push("integer", i, i + text.length, Number(text));
      i += text.length;
      continue;
    }

    // Identifiers / keywords ---------------------------------------
    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (i < source.length && isIdentPart(source[i]!)) i++;
      while (source[i] === "." && i + 1 < source.length && isIdentStart(source[i + 1]!)) {
        i++;
        while (i < source.length && isIdentPart(source[i]!)) i++;
      }
      const text = source.slice(start, i);
      const keyword = KEYWORDS[text];
      if (keyword) push(keyword, start, i);
      else push("ident", start, i, text);
      continue;
    }

    // Punctuation and operators ------------------------------------
    const two = source.slice(i, i + 2);
    if (two === "==") { push("eq", i, i + 2); i += 2; continue; }
    if (two === "!=") { push("ne", i, i + 2); i += 2; continue; }
    if (two === ">=") { push("ge", i, i + 2); i += 2; continue; }
    if (two === "<=") { push("le", i, i + 2); i += 2; continue; }

    switch (ch) {
      case ">": push("gt", i, i + 1); i++; continue;
      case "<": push("lt", i, i + 1); i++; continue;
      case "(": push("lparen", i, i + 1); i++; continue;
      case ")": push("rparen", i, i + 1); i++; continue;
      case "[": push("lbracket", i, i + 1); i++; continue;
      case "]": push("rbracket", i, i + 1); i++; continue;
      case ",": push("comma", i, i + 1); i++; continue;
      default:
        diagnostics.error("SYNTAX_ERROR", `Unexpected character '${ch}'.`, { start: i, end: i + 1 });
        i++;
        continue;
    }
  }

  tokens.push({ kind: "eof", text: "", start: source.length, end: source.length });
  return { tokens, diagnostics: diagnostics.all };
}
