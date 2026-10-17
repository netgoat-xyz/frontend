/**
 * Minimal user-agent classification for the session list. Deliberately
 * dependency-free: we only need a friendly browser and OS label.
 */

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/Windows NT/, "Windows"],
  [/Mac OS X/, "macOS"],
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

export function describeUserAgent(userAgent?: string | null): {
  browser: string;
  os: string;
} {
  if (!userAgent) return { browser: "Unknown device", os: "" };

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const os = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];

  return {
    browser: browser ?? "Unknown browser",
    os: os ?? "",
  };
}
