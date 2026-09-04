import { describe, expect, test } from "bun:test";
import {
  STREAMER_DOMAIN_FIELDS,
  STREAMER_PROXY_FIELDS,
  mongoFieldsFromOriginSave,
  mongoFieldsFromProxyPoolSave,
  mongoFieldsFromRoutePolicySave,
  mongoFieldsFromSslSave,
  normalizeDomainWafRule,
  normalizePemMaterial,
  normalizeRoutePolicy,
} from "./control-plane";

describe("control-plane Mongo fields the streamer reads", () => {
  test("origin save writes target_url", () => {
    const update = mongoFieldsFromOriginSave("http://127.0.0.1:3000");
    expect(update).toEqual({ target_url: "http://127.0.0.1:3000" });
    expect(STREAMER_DOMAIN_FIELDS).toContain("target_url");
  });

  test("SSL save writes cert PEMs and auto_ssl", () => {
    const pem = normalizePemMaterial(
      "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----",
      "-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----",
    );
    const update = mongoFieldsFromSslSave({
      auto_ssl: true,
      ...pem,
    });

    expect(update.auto_ssl).toBe(true);
    expect(update.ssl_enabled).toBe(true);
    expect(update.certificate_pem).toContain("BEGIN CERTIFICATE");
    expect(update.private_key_pem).toContain("BEGIN PRIVATE KEY");
    expect(STREAMER_DOMAIN_FIELDS).toEqual(
      expect.arrayContaining(["certificate_pem", "private_key_pem", "auto_ssl", "ssl_enabled"]),
    );
  });

  test("route policy save writes cache and bandwidth under route_policy", () => {
    const policy = normalizeRoutePolicy({
      cache: { enabled: true, ttl_seconds: 300 },
      bandwidth: { enabled: true, bytes_per_second: 1048576, key: "ip" },
    });
    const update = mongoFieldsFromRoutePolicySave(policy ?? null);

    expect(update.route_policy).toEqual({
      cache: { enabled: true, ttl_seconds: 300 },
      bandwidth: { enabled: true, bytes_per_second: 1048576, key: "ip" },
    });
    expect(STREAMER_DOMAIN_FIELDS).toContain("route_policy");
  });

  test("empty route policy clears the Mongo field so agents inherit defaults", () => {
    expect(normalizeRoutePolicy({})).toBeUndefined();
    expect(mongoFieldsFromRoutePolicySave(null)).toEqual({ route_policy: null });
  });

  test("WAF save writes name, expression, action, and priority", () => {
    const rule = normalizeDomainWafRule({
      name: "block-sql",
      expression: "contains(request.path, 'SELECT')",
      action: "block",
      priority: 10,
    });

    expect(rule).toEqual({
      name: "block-sql",
      expression: "contains(request.path, 'SELECT')",
      action: "BLOCK",
      priority: 10,
      enabled: true,
    });
    expect(STREAMER_DOMAIN_FIELDS).toContain("waf_rules");
  });

  test("proxy pool save writes upstream_servers and primary target_url", () => {
    const update = mongoFieldsFromProxyPoolSave({
      domainId: "dom_1",
      upstreamServers: ["http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    });

    expect(update.target_url).toBe("http://127.0.0.1:3000");
    expect(update.upstream_servers).toEqual([
      { url: "http://127.0.0.1:3000" },
      { url: "http://127.0.0.1:3001" },
    ]);
    expect(STREAMER_PROXY_FIELDS).toEqual(
      expect.arrayContaining(["domain_id", "upstream_servers", "enabled"]),
    );
  });

  test("rejects incomplete PEM pairs", () => {
    expect(() =>
      normalizePemMaterial("-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----", ""),
    ).toThrow("together");
  });

  test("rejects unnamed WAF rules", () => {
    expect(() =>
      normalizeDomainWafRule({ name: " ", expression: "true" }),
    ).toThrow("name");
  });
});
