/**
 * Runtime log tail for the admin console.
 *
 * A route handler rather than a server action: the viewer polls it every two
 * seconds, and a plain GET keeps that cheap and cacheable-by-nothing. Access
 * is admin-only.
 */

import { type NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-guards";
import { getRuntimeLogs } from "@/lib/runtime-logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 500;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ ok: false, error: "Account suspended." }, { status: 403 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
  }

  const requested = Number.parseInt(
    request.nextUrl.searchParams.get("limit") ?? "200",
    10,
  );
  const limit = Number.isFinite(requested)
    ? Math.min(MAX_LIMIT, Math.max(1, requested))
    : 200;

  return NextResponse.json(
    { ok: true, logs: getRuntimeLogs(limit) },
    { headers: { "cache-control": "no-store" } },
  );
}
