import { describe, expect, test } from "bun:test";
import {
  BUILTIN_MIDDLEWARE_API_VERSION,
  BUILTIN_MIDDLEWARE_MANIFEST_KIND,
  calculatePublisherCredibility,
  catalogPluginId,
  deploymentSelectionFromManifest,
  hashBuiltinMiddlewareManifest,
  normalizeBuiltinMiddlewareManifest,
  validateBuiltinMiddlewareManifest,
  validateSHA256,
  type BuiltinMiddlewareManifest,
} from "./plugin-catalog";

const descriptorHash = "a".repeat(64);

const manifest: BuiltinMiddlewareManifest = {
  kind: BUILTIN_MIDDLEWARE_MANIFEST_KIND,
  api_version: BUILTIN_MIDDLEWARE_API_VERSION,
  factory_id: "netgoat/noop",
  granted_capabilities: ["route.read", "request.read"],
  config: { enabled: true, limits: { requests: 20 } },
};

describe("developer plugin catalog contract", () => {
  test("normalizes immutable built-in manifests before hashing", () => {
    const normalized = normalizeBuiltinMiddlewareManifest(manifest);
    const reordered = normalizeBuiltinMiddlewareManifest({
      ...manifest,
      granted_capabilities: ["request.read", "route.read"],
      config: { limits: { requests: 20 }, enabled: true },
    });

    expect(normalized.granted_capabilities).toEqual(["request.read", "route.read"]);
    expect(hashBuiltinMiddlewareManifest(normalized)).toBe(hashBuiltinMiddlewareManifest(reordered));
  });

  test("rejects executable, artifact, and secret-bearing manifest content", () => {
    const executable = validateBuiltinMiddlewareManifest({ ...manifest, source: "export default () => {}" });
    const artifact = validateBuiltinMiddlewareManifest({ ...manifest, config: { artifact: "plugin.wasm" } });
    const secret = validateBuiltinMiddlewareManifest({ ...manifest, config: { api_key: "not-allowed" } });

    expect(executable.some((error) => error.includes("not permitted"))).toBe(true);
    expect(artifact.some((error) => error.includes("not permitted"))).toBe(true);
    expect(secret.some((error) => error.includes("not permitted"))).toBe(true);
  });

  test("uses the compiled descriptor digest, not the manifest digest, for agent deployment", () => {
    const selection = deploymentSelectionFromManifest("netgoat/noop", "1.2.3", manifest, descriptorHash);

    expect(selection.sha256).toBe(descriptorHash);
    expect(selection.factory_id).toBe("netgoat/noop");
    expect(selection.api_version).toBe(BUILTIN_MIDDLEWARE_API_VERSION);
    expect(validateSHA256(selection.sha256)).toEqual([]);
  });

  test("keeps catalog identity stable and bounded", () => {
    expect(catalogPluginId("netgoat", "noop")).toBe("netgoat/noop");
    expect(() => catalogPluginId("p".repeat(80), "q".repeat(80))).toThrow("Plugin identity");
  });

  test("calculates credibility from server-derived verification and adoption data", () => {
    const verified = calculatePublisherCredibility({
      verification_status: "verified",
      approved_release_count: 10,
      active_installation_count: 30,
      rejected_review_count: 0,
    });
    const rejected = calculatePublisherCredibility({
      verification_status: "rejected",
      approved_release_count: 0,
      active_installation_count: 0,
      rejected_review_count: 4,
    });

    expect(verified.score).toBe(100);
    expect(rejected.score).toBe(0);
  });
});
