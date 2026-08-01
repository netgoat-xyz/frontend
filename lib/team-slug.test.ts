import { describe, expect, test } from "bun:test";
import { sanitizeTeamSlug, validateTeamSlug } from "./team-slug";

describe("team slug rules", () => {
  test("slugifies free-form names", () => {
    expect(sanitizeTeamSlug("  Acme Platform Team  ")).toBe("acme-platform-team");
  });

  test("rejects reserved slugs", () => {
    const result = validateTeamSlug("teams");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("reserved");
  });

  test("accepts bounded normalized slugs", () => {
    const result = validateTeamSlug("edge-security");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("edge-security");
  });
});
