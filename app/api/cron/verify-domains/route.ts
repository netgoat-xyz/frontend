/**
 * Background domain verification.
 *
 * Call from a scheduler (Vercel Cron, GitHub Actions, systemd timer) with
 * `Authorization: Bearer $CRON_SECRET` on either GET or POST.
 *
 * Security: the secret is required — an unconfigured deployment fails closed
 * with 503 instead of falling back to a guessable default, and comparisons
 * are constant-time. Previously every deployment without CRON_SECRET was
 * open to anyone who knew (or guessed) the default string.
 *
 * Performance: lookups run with bounded concurrency and results land in one
 * bulk write, so a full batch of 50 domains costs one round trip instead of
 * 50 sequential saves.
 */

import { timingSafeEqual } from "node:crypto";

import type { Types } from "mongoose";
import { type NextRequest, NextResponse } from "next/server";

import {
  DOMAIN_VERIFICATION_RECORD_NAME,
  hasVerificationToken,
} from "@/lib/domain-verification";
import dbConnect from "@/lib/mongoose";
import { isLocalDevelopmentDomain } from "@/lib/validation/domain";
import Domain from "@/models/Domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_LIMIT = 50;
const LOOKUP_TIMEOUT_MS = 5000;
const LOOKUP_CONCURRENCY = 8;
const RECHECK_INTERVAL_MS = 30 * 60 * 1000;

type AuthCheck = "ok" | "unconfigured" | "unauthorized";

/** Constant-time secret comparison that never throws on length mismatch. */
function authorize(request: NextRequest): AuthCheck {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "unconfigured";

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const expected = Buffer.from(secret);
  const candidate = Buffer.from(provided);
  if (candidate.length !== expected.length) return "unauthorized";

  return timingSafeEqual(candidate, expected) ? "ok" : "unauthorized";
}

type VerificationOutcome = {
  id: Types.ObjectId;
  domain: string;
  outcome: "verified" | "pending" | "skipped";
  error?: string;
};

/** Resolves to null when the lookup outlives the budget. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDomain(input: {
  domainId: Types.ObjectId;
  domain: string;
  token: string | undefined;
}): Promise<VerificationOutcome> {
  if (isLocalDevelopmentDomain(input.domain)) {
    return { id: input.domainId, domain: input.domain, outcome: "verified" };
  }

  if (!input.token) {
    return {
      id: input.domainId,
      domain: input.domain,
      outcome: "skipped",
      error: "No verification token stored",
    };
  }

  const verified = await withTimeout(
    hasVerificationToken(input.domain, input.token),
    LOOKUP_TIMEOUT_MS,
  );

  return {
    id: input.domainId,
    domain: input.domain,
    outcome: verified === true ? "verified" : "pending",
  };
}

/** Runs the worker with a bounded number of in-flight lookups. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await worker(item);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

async function runVerification(): Promise<NextResponse> {
  await dbConnect();

  const now = new Date();
  const due = await Domain.find({
    active: true,
    $or: [
      { verified: false },
      { verified: true, next_verification_check: { $lte: now } },
    ],
  })
    .select("_id domain verification_token")
    .limit(BATCH_LIMIT)
    .lean<{ _id: Types.ObjectId; domain: string; verification_token?: string }[]>();

  if (due.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, verified: 0, pending: 0 });
  }

  const results = await mapWithConcurrency(due, LOOKUP_CONCURRENCY, (entry) =>
    checkDomain({
      domainId: entry._id,
      domain: entry.domain,
      token: entry.verification_token,
    }),
  );

  const nowAfter = new Date();
  const nextCheck = new Date(nowAfter.getTime() + RECHECK_INTERVAL_MS);
  const localDomains = results
    .filter((result) => isLocalDevelopmentDomain(result.domain))
    .map((result) => result.domain);

  await Domain.bulkWrite(
    results.map((result) => ({
      updateOne: {
        filter: { _id: result.id },
        update: {
          $set: {
            ...(result.outcome === "verified"
              ? { verified: true, next_verification_check: null }
              : result.outcome === "pending"
                ? { verified: false, next_verification_check: nextCheck }
                : {}),
            last_verification_check: nowAfter,
          },
          $inc: { verification_attempts: 1 },
        },
      },
    })),
  );

  const verified = results.filter((result) => result.outcome === "verified").length;
  const pending = results.filter((result) => result.outcome === "pending").length;
  const skipped = results.filter((result) => result.outcome === "skipped");

  console.log(
    `[cron/verify-domains] checked=${results.length} verified=${verified} pending=${pending} skipped=${skipped.length}`,
  );

  return NextResponse.json({
    ok: true,
    checked: results.length,
    verified,
    pending,
    skipped: skipped.map((result) => ({
      domain: result.domain,
      reason: result.error,
    })),
    localDomains: [...localDomains],
    nextCheckAt: nextCheck.toISOString(),
    recordName: DOMAIN_VERIFICATION_RECORD_NAME,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const auth = authorize(request);

  if (auth === "unconfigured") {
    return NextResponse.json(
      {
        ok: false,
        error: "CRON_SECRET is not configured on this deployment.",
      },
      { status: 503 },
    );
  }

  if (auth === "unauthorized") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runVerification();
  } catch (error) {
    console.error("[cron/verify-domains] run failed:", error);
    return NextResponse.json(
      { ok: false, error: "Verification run failed." },
      { status: 500 },
    );
  }
}
