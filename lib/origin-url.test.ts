import { describe, expect, test } from "bun:test";
import { normalizeOriginUrl, validateOriginUrl } from "./origin-url";

describe("origin url validation", () => {
  test("normalizes schemeless local origins", () => {
    expect(normalizeOriginUrl("127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(normalizeOriginUrl("https://app.localhost:8443/")).toBe("https://app.localhost:8443");
  });

  test("preserves explicit paths but strips query fragments", () => {
    expect(normalizeOriginUrl("https://origin.internal/app/?debug=1#frag")).toBe(
      "https://origin.internal/app",
    );
  });

  test("rejects unsupported protocols", () => {
    const result = validateOriginUrl("ftp://example.com");
    expect(result.valid).toBe(false);
  });
});
