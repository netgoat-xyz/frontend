import { describe, expect, test } from "bun:test";
import {
  isLocalDevelopmentDomain,
  sanitizeDomainInput,
  validateDomainSyntax,
  validateDomainWithOnlineTld,
} from "./domain-validation";

describe("domain validation", () => {
  test("sanitizes host-like input before validation", () => {
    expect(sanitizeDomainInput(" https://App.Example.com/path ")).toBe("app.example.com");
  });

  test("accepts localhost-style development domains", async () => {
    expect(validateDomainSyntax("localhost").valid).toBe(true);
    expect(isLocalDevelopmentDomain("api.localhost")).toBe(true);

    const result = await validateDomainWithOnlineTld("api.localhost");
    expect(result.valid).toBe(true);
    expect(result.domainKind).toBe("local");
    expect(result.tldSource).toBe("local");
  });

  test("accepts reserved test domains without IANA lookups", async () => {
    const result = await validateDomainWithOnlineTld("gateway.example.test");
    expect(result.valid).toBe(true);
    expect(result.domainKind).toBe("local");
    expect(result.tldSource).toBe("local");
  });

  test("rejects single-label non-local names", () => {
    const result = validateDomainSyntax("internalservice");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("top-level domain");
  });
});
