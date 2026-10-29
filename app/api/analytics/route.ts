/**
 * Analytics ingestion for the self-hosted marketing/docs pages.
 *
 * Public by design — visitors are anonymous — so the endpoint is hardened
 * instead: strict payload validation, a bounded per-IP rate window, a body
 * size cap, and 204 responses even when the write is dropped so analytics can
 * never break or slow a page render.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import dbConnect from "@/lib/mongoose";
import Analytics, { type AnalyticsDevice } from "@/models/Analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 240;
const TRACKER_CAPACITY = 10_000;

const payloadSchema = z.object({
  type: z.enum(["pageview", "web-vital"]),
  path: z.string().min(1).max(1024),
  visitorId: z.string().min(1).max(128),
  sessionId: z.string().max(128).optional(),
  referrer: z.string().max(1024).optional(),
  metricName: z.string().max(64).optional(),
  metricValue: z.number().finite().optional(),
  metricRating: z.string().max(32).optional(),
});

type RateEntry = { count: number; resetAt: number };

// In-memory window tracker: best effort by design (per-instance, resets on
// deploy) and bounded in size so it can never grow without limit.
const globalForRate = globalThis as typeof globalThis & {
  __analyticsRate?: Map<string, RateEntry>;
};
const rateBuckets: Map<string, RateEntry> =
  globalForRate.__analyticsRate ?? new Map();
globalForRate.__analyticsRate = rateBuckets;

function isRateLimited(key: string, now: number): boolean {
  const entry = rateBuckets.get(key);

  if (!entry || entry.resetAt <= now) {
    if (rateBuckets.size >= TRACKER_CAPACITY) {
      for (const [bucketKey, bucket] of rateBuckets) {
        if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
      }
      if (rateBuckets.size >= TRACKER_CAPACITY) rateBuckets.clear();
    }
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function detectDevice(userAgent: string): AnalyticsDevice {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Cheapest possible rejection first: oversized bodies never get parsed.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  if (isRateLimited(clientKey(request), Date.now())) {
    return new NextResponse(null, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload." },
      { status: 400 },
    );
  }

  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

  try {
    await dbConnect();
    await Analytics.collection.insertOne({
      ...parsed.data,
      userAgent,
      device: detectDevice(userAgent),
      timestamp: new Date(),
      createdAt: new Date(),
    });
  } catch (error) {
    // Ingestion failures are logged, never surfaced as an error to the page.
    console.error("[analytics] insert failed:", error);
  }

  return new NextResponse(null, { status: 204 });
}
