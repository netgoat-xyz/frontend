import { trackAnalytics } from "@/actions/analytics";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path") || "/";
  const visitorId = searchParams.get("visitorId") || "test-visitor";

  // Manually trigger the analytics action
  // The 'trackAnalytics' function will read the headers from the current request context,
  // so the User-Agent sent by the Python script will be captured correctly.
  await trackAnalytics({
    type: "pageview",
    path: path,
    visitorId: visitorId,
  });

  return NextResponse.json({ success: true, trackedPath: path });
}
