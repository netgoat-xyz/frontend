#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULTS = {
  host: "http://localhost",
  newPort: 3000,
  oldPort: 3001,
  requests: 80,
  concurrency: 10,
  timeoutMs: 10_000,
  ignoreTimeouts: true,
  strictReachability: false,
  warmupRequests: 5,
  rounds: 3,
  docsDir: "app/docs",
  includeDocs: true,
  baseRoutes: ["/", "/auth", "/blog", "/status"],
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--host" && next) {
      options.host = next;
      i += 1;
      continue;
    }
    if (arg === "--new-port" && next) {
      options.newPort = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--old-port" && next) {
      options.oldPort = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--routes" && next) {
      options.baseRoutes = next
        .split(",")
        .map((route) => normalizeRoute(route.trim()))
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (arg === "--docs-dir" && next) {
      options.docsDir = next;
      i += 1;
      continue;
    }
    if (arg === "--no-docs") {
      options.includeDocs = false;
      continue;
    }
    if (arg === "--requests" && next) {
      options.requests = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--concurrency" && next) {
      options.concurrency = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--timeout-ms" && next) {
      options.timeoutMs = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--ignore-timeouts") {
      options.ignoreTimeouts = true;
      continue;
    }
    if (arg === "--count-timeouts") {
      options.ignoreTimeouts = false;
      continue;
    }
    if (arg === "--strict-reachability") {
      options.strictReachability = true;
      continue;
    }
    if (arg === "--warmup" && next) {
      options.warmupRequests = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--rounds" && next) {
      options.rounds = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  validateOptions(options);
  return options;
}

function validateOptions(options) {
  const positiveNumberFields = [
    "newPort",
    "oldPort",
    "requests",
    "concurrency",
    "warmupRequests",
    "rounds",
  ];

  for (const key of positiveNumberFields) {
    const value = options[key];
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Invalid value for --${toKebabCase(key)}: ${value}`);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 0) {
    throw new Error(`Invalid value for --timeout-ms: ${options.timeoutMs}`);
  }

  if (!options.baseRoutes.length) {
    throw new Error("At least one route must be provided via --routes.");
  }
}

function toKebabCase(input) {
  return input.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function normalizeRoute(route) {
  if (!route) return "";
  if (route.startsWith("http://") || route.startsWith("https://")) {
    const url = new URL(route);
    return (url.pathname || "/").replace(/\/$/, "") || "/";
  }
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return normalized.replace(/\/$/, "") || "/";
}

function printHelp() {
  console.log(`Benchmark two server versions on localhost ports for multiple routes.

Usage:
  node scripts/benchmark-ports.mjs [options]

Options:
  --host <url>           Base host (default: http://localhost)
  --new-port <number>    New server port (default: 3000)
  --old-port <number>    Old server port (default: 3001)
  --routes <csv>         Base routes CSV (default: /,/auth,/blog,/status)
  --docs-dir <path>      Docs source directory (default: app/docs)
  --no-docs              Skip auto-discovered docs routes
  --requests <number>    Requests per round per server per route (default: 80)
  --concurrency <number> Parallel workers (default: 10)
  --timeout-ms <number>  Per-request timeout (default: 10000)
  --ignore-timeouts      Ignore timed-out requests in latency/failure stats (default)
  --count-timeouts       Count timed-out requests as failures
  --strict-reachability  Abort if either server root is unreachable
  --warmup <number>      Warmup requests before each measured run (default: 5)
  --rounds <number>      Number of rounds (default: 3)
  -h, --help             Show this help message

Examples:
  node scripts/benchmark-ports.mjs
  node scripts/benchmark-ports.mjs --requests 150 --concurrency 20
  node scripts/benchmark-ports.mjs --no-docs --routes /,/auth,/status
`);
}

function buildFetchOptions(timeoutMs) {
  if (timeoutMs <= 0) {
    return {};
  }

  return { signal: AbortSignal.timeout(timeoutMs) };
}

function isTimeoutError(error) {
  if (!error) return false;
  const message = String(error.message || "");
  return error.name === "TimeoutError" || /timed?\s*out/i.test(message);
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sortedValues.length) - 1;
  const index = Math.min(sortedValues.length - 1, Math.max(0, rank));
  return sortedValues[index];
}

function aggregate(results) {
  const latencies = results.flatMap((r) => r.latencies).sort((a, b) => a - b);
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const success = results.reduce((sum, r) => sum + r.success, 0);
  const failure = results.reduce((sum, r) => sum + r.failure, 0);
  const timeoutIgnored = results.reduce((sum, r) => sum + r.timeoutIgnored, 0);
  const bytes = results.reduce((sum, r) => sum + r.bytes, 0);
  const durationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  const measuredRequests = success + failure;
  const avgLatencyMs = latencies.reduce((sum, v) => sum + v, 0) / Math.max(latencies.length, 1);

  return {
    totalRequests,
    measuredRequests,
    success,
    failure,
    timeoutIgnored,
    bytes,
    durationMs,
    rps: measuredRequests / Math.max(durationMs / 1000, 0.0001),
    avgLatencyMs,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    p99LatencyMs: percentile(latencies, 99),
    successRate: (success / Math.max(measuredRequests, 1)) * 100,
  };
}

function compareHigherIsBetter(newValue, oldValue) {
  if (oldValue === 0) return Number.POSITIVE_INFINITY;
  return ((newValue - oldValue) / oldValue) * 100;
}

function compareLowerIsBetter(newValue, oldValue) {
  if (oldValue === 0) return 0;
  return ((oldValue - newValue) / oldValue) * 100;
}

function signed(value) {
  if (!Number.isFinite(value)) return "n/a";
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function isDynamicSegment(segment) {
  return segment.startsWith("[") && segment.endsWith("]");
}

function isGroupSegment(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isParallelSegment(segment) {
  return segment.startsWith("@");
}

function routeFromDocsPageFile(pageFile, docsDir) {
  const relativePath = path.relative(docsDir, pageFile);
  const pageFolder = path.dirname(relativePath);
  const rawSegments = pageFolder === "." ? [] : pageFolder.split(path.sep);
  const segments = rawSegments.filter((segment) => !isGroupSegment(segment));

  if (segments.some((segment) => isDynamicSegment(segment) || isParallelSegment(segment))) {
    return null;
  }

  return normalizeRoute(`/docs/${segments.join("/")}`);
}

async function findDocsPageFiles(currentDir, accumulator) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await findDocsPageFiles(fullPath, accumulator);
      continue;
    }

    if (/^page\.(tsx|ts|jsx|js|mdx|md)$/.test(entry.name)) {
      accumulator.push(fullPath);
    }
  }
}

async function discoverDocsRoutes(docsDir) {
  const pageFiles = [];
  try {
    await findDocsPageFiles(docsDir, pageFiles);
  } catch {
    return { routes: [], discoveredPageFiles: 0 };
  }

  const routes = new Set();
  for (const pageFile of pageFiles) {
    const route = routeFromDocsPageFile(pageFile, docsDir);
    if (route) {
      routes.add(route);
    }
  }

  return {
    routes: [...routes].sort((a, b) => a.localeCompare(b)),
    discoveredPageFiles: pageFiles.length,
  };
}

async function warmup(url, amount, timeoutMs) {
  for (let i = 0; i < amount; i += 1) {
    try {
      const response = await fetch(url, buildFetchOptions(timeoutMs));
      await response.arrayBuffer();
    } catch {
      // Warmup failures are ignored so the benchmark can still run.
    }
  }
}

async function benchmarkTarget({
  label,
  url,
  totalRequests,
  concurrency,
  timeoutMs,
  warmupRequests,
  ignoreTimeouts,
}) {
  await warmup(url, warmupRequests, timeoutMs);

  const latencies = [];
  let success = 0;
  let failure = 0;
  let timeoutIgnored = 0;
  let bytes = 0;
  let nextRequest = 0;

  // A worker pool gives stable pressure while keeping implementation dependency-free.
  async function worker() {
    while (true) {
      const requestId = nextRequest;
      nextRequest += 1;

      if (requestId >= totalRequests) {
        return;
      }

      const requestStart = performance.now();
      try {
        const response = await fetch(url, buildFetchOptions(timeoutMs));
        const body = await response.arrayBuffer();
        bytes += body.byteLength;

        if (response.ok) {
          success += 1;
        } else {
          failure += 1;
        }
        latencies.push(performance.now() - requestStart);
      } catch (error) {
        if (ignoreTimeouts && isTimeoutError(error)) {
          timeoutIgnored += 1;
          continue;
        }

        failure += 1;
        latencies.push(performance.now() - requestStart);
      }
    }
  }

  const start = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = performance.now() - start;

  return {
    label,
    url,
    totalRequests,
    success,
    failure,
    timeoutIgnored,
    bytes,
    durationMs,
    latencies,
  };
}

function printRoundResult(round, totalRounds, result) {
  const measuredRequests = result.success + result.failure;
  const roundRps = measuredRequests / Math.max(result.durationMs / 1000, 0.0001);
  const avgMs = result.latencies.reduce((sum, v) => sum + v, 0) / Math.max(result.latencies.length, 1);
  const timeoutNote = result.timeoutIgnored > 0 ? ` | ignored timeouts ${result.timeoutIgnored}` : "";

  console.log(
    `[Round ${round}/${totalRounds}] ${result.label} | ${roundRps.toFixed(2)} req/s | avg ${formatMs(avgMs)} | ok ${result.success}/${Math.max(measuredRequests, 1)}${timeoutNote}`,
  );
}

function printComparison(newAgg, oldAgg) {
  const rows = [
    {
      metric: "Requests/sec",
      newVal: newAgg.rps.toFixed(2),
      oldVal: oldAgg.rps.toFixed(2),
      delta: signed(compareHigherIsBetter(newAgg.rps, oldAgg.rps)),
    },
    {
      metric: "Average latency",
      newVal: formatMs(newAgg.avgLatencyMs),
      oldVal: formatMs(oldAgg.avgLatencyMs),
      delta: signed(compareLowerIsBetter(newAgg.avgLatencyMs, oldAgg.avgLatencyMs)),
    },
    {
      metric: "P50 latency",
      newVal: formatMs(newAgg.p50LatencyMs),
      oldVal: formatMs(oldAgg.p50LatencyMs),
      delta: signed(compareLowerIsBetter(newAgg.p50LatencyMs, oldAgg.p50LatencyMs)),
    },
    {
      metric: "P95 latency",
      newVal: formatMs(newAgg.p95LatencyMs),
      oldVal: formatMs(oldAgg.p95LatencyMs),
      delta: signed(compareLowerIsBetter(newAgg.p95LatencyMs, oldAgg.p95LatencyMs)),
    },
    {
      metric: "P99 latency",
      newVal: formatMs(newAgg.p99LatencyMs),
      oldVal: formatMs(oldAgg.p99LatencyMs),
      delta: signed(compareLowerIsBetter(newAgg.p99LatencyMs, oldAgg.p99LatencyMs)),
    },
    {
      metric: "Success rate",
      newVal: formatPercent(newAgg.successRate),
      oldVal: formatPercent(oldAgg.successRate),
      delta: signed(compareHigherIsBetter(newAgg.successRate, oldAgg.successRate)),
    },
    {
      metric: "Ignored timeouts",
      newVal: String(newAgg.timeoutIgnored),
      oldVal: String(oldAgg.timeoutIgnored),
      delta: "n/a",
    },
  ];

  console.log("\nComparison (new:3000 vs old:3001)");
  console.log("Metric           | New             | Old             | Delta (new vs old)");
  console.log("-----------------|-----------------|-----------------|-------------------");
  for (const row of rows) {
    console.log(
      `${row.metric.padEnd(16)} | ${row.newVal.padEnd(15)} | ${row.oldVal.padEnd(15)} | ${row.delta}`,
    );
  }
}

function buildRouteRow(route, newAgg, oldAgg) {
  return {
    route,
    newAvg: formatMs(newAgg.avgLatencyMs),
    oldAvg: formatMs(oldAgg.avgLatencyMs),
    avgDelta: signed(compareLowerIsBetter(newAgg.avgLatencyMs, oldAgg.avgLatencyMs)),
    newP95: formatMs(newAgg.p95LatencyMs),
    oldP95: formatMs(oldAgg.p95LatencyMs),
    p95Delta: signed(compareLowerIsBetter(newAgg.p95LatencyMs, oldAgg.p95LatencyMs)),
    newRps: newAgg.rps.toFixed(2),
    oldRps: oldAgg.rps.toFixed(2),
    rpsDelta: signed(compareHigherIsBetter(newAgg.rps, oldAgg.rps)),
    success: `${formatPercent(newAgg.successRate)} / ${formatPercent(oldAgg.successRate)}`,
    timeoutIgnored: `${newAgg.timeoutIgnored} / ${oldAgg.timeoutIgnored}`,
  };
}

function printRouteTable(rows) {
  console.log("\nPer-route comparison (new:3000 vs old:3001)");
  console.log(
    "Route                  | Avg (new)   | Avg (old)   | Avg delta | P95 (new)   | P95 (old)   | P95 delta | RPS (new) | RPS (old) | RPS delta | Success (new/old) | Ign TO (new/old)",
  );
  console.log(
    "-----------------------|-------------|-------------|-----------|-------------|-------------|-----------|-----------|-----------|-----------|-------------------|-----------------",
  );

  for (const row of rows) {
    console.log(
      `${row.route.padEnd(22)} | ${row.newAvg.padEnd(11)} | ${row.oldAvg.padEnd(11)} | ${row.avgDelta.padEnd(9)} | ${row.newP95.padEnd(11)} | ${row.oldP95.padEnd(11)} | ${row.p95Delta.padEnd(9)} | ${row.newRps.padEnd(9)} | ${row.oldRps.padEnd(9)} | ${row.rpsDelta.padEnd(9)} | ${row.success.padEnd(19)} | ${row.timeoutIgnored}`,
    );
  }
}

async function ensureReachable(url, timeoutMs) {
  try {
    const response = await fetch(url, buildFetchOptions(timeoutMs));
    await response.arrayBuffer();
    return { reachable: response.ok, timedOut: false };
  } catch (error) {
    return { reachable: false, timedOut: isTimeoutError(error) };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const docsResult = options.includeDocs
    ? await discoverDocsRoutes(options.docsDir)
    : { routes: [], discoveredPageFiles: 0 };

  const allRoutes = [...new Set([...options.baseRoutes.map(normalizeRoute), ...docsResult.routes])]
    .filter(Boolean)
    .sort((a, b) => {
      if (a === "/") return -1;
      if (b === "/") return 1;
      return a.localeCompare(b);
    });

  const newRootUrl = `${options.host}:${options.newPort}/`;
  const oldRootUrl = `${options.host}:${options.oldPort}/`;

  console.log("Benchmark configuration");
  console.log(`- host: ${options.host}`);
  console.log(`- new server: ${options.host}:${options.newPort}`);
  console.log(`- old server: ${options.host}:${options.oldPort}`);
  console.log(`- base routes: ${options.baseRoutes.join(", ")}`);
  console.log(`- docs included: ${options.includeDocs ? "yes" : "no"}`);
  if (options.includeDocs) {
    console.log(`- docs directory: ${options.docsDir}`);
    console.log(`- docs page files discovered: ${docsResult.discoveredPageFiles}`);
    console.log(`- docs routes discovered: ${docsResult.routes.length}`);
  }
  console.log(`- total routes: ${allRoutes.length}`);
  console.log(`- requests per round: ${options.requests}`);
  console.log(`- concurrency: ${options.concurrency}`);
  console.log(`- rounds: ${options.rounds}`);
  console.log(`- timeout: ${options.timeoutMs > 0 ? `${options.timeoutMs} ms` : "disabled"}`);
  console.log(`- ignore timeout errors: ${options.ignoreTimeouts ? "yes" : "no"}`);
  console.log(`- strict reachability: ${options.strictReachability ? "yes" : "no"}\n`);

  console.log(`Routes to benchmark:\n- ${allRoutes.join("\n- ")}\n`);

  const [newReachable, oldReachable] = await Promise.all([
    ensureReachable(newRootUrl, options.timeoutMs),
    ensureReachable(oldRootUrl, options.timeoutMs),
  ]);

  if (!newReachable.reachable || !oldReachable.reachable) {
    const missing = [
      !newReachable.reachable
        ? `new server (${newRootUrl})${newReachable.timedOut ? " [timeout]" : ""}`
        : null,
      !oldReachable.reachable
        ? `old server (${oldRootUrl})${oldReachable.timedOut ? " [timeout]" : ""}`
        : null,
    ]
      .filter(Boolean)
      .join(" and ");

    if (options.strictReachability) {
      throw new Error(`Cannot reach ${missing}. Make sure both servers are running before benchmarking.`);
    }

    console.warn(`Warning: cannot verify ${missing}. Continuing benchmark anyway.`);
  }

  const routeSummaries = [];

  for (const route of allRoutes) {
    const collected = { new: [], old: [] };
    const newUrl = `${options.host}:${options.newPort}${route}`;
    const oldUrl = `${options.host}:${options.oldPort}${route}`;

    console.log(`\nBenchmarking route ${route}`);

    for (let round = 1; round <= options.rounds; round += 1) {
      const roundTargets =
        round % 2 === 1
          ? [
              { key: "old", label: `old:3001 ${route}`, url: oldUrl },
              { key: "new", label: `new:3000 ${route}`, url: newUrl },
            ]
          : [
              { key: "new", label: `new:3000 ${route}`, url: newUrl },
              { key: "old", label: `old:3001 ${route}`, url: oldUrl },
            ];

      for (const target of roundTargets) {
        const result = await benchmarkTarget({
          label: target.label,
          url: target.url,
          totalRequests: options.requests,
          concurrency: options.concurrency,
          timeoutMs: options.timeoutMs,
          warmupRequests: options.warmupRequests,
          ignoreTimeouts: options.ignoreTimeouts,
        });
        collected[target.key].push(result);
        printRoundResult(round, options.rounds, result);
      }
    }

    const newAgg = aggregate(collected.new);
    const oldAgg = aggregate(collected.old);
    routeSummaries.push({ route, newAgg, oldAgg, collected });
  }

  const tableRows = routeSummaries.map((row) => buildRouteRow(row.route, row.newAgg, row.oldAgg));
  printRouteTable(tableRows);

  const allNew = routeSummaries.flatMap((summary) => summary.collected.new);
  const allOld = routeSummaries.flatMap((summary) => summary.collected.old);
  const newAgg = aggregate(allNew);
  const oldAgg = aggregate(allOld);

  console.log("\nOverall totals across all routes");
  printComparison(newAgg, oldAgg);
}

main().catch((error) => {
  console.error(`\nBenchmark failed: ${error.message}`);
  process.exit(1);
});