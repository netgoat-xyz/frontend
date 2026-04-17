import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Analytics from "@/models/Analytics";

export const runtime = "nodejs";

type AnalyticsPayload = {
  type: "pageview" | "web-vital";
  path: string;
  visitorId: string;
  referrer?: string;
  metricName?: string;
  metricValue?: number;
  metricRating?: string;
};

type AnalyticsInsert = AnalyticsPayload & {
  userAgent: string;
  device: "desktop" | "mobile" | "tablet";
  timestamp: Date;
};

const FLUSH_BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 750;
const MAX_QUEUE_SIZE = 5000;

type AnalyticsQueueState = {
  queue: AnalyticsInsert[];
  flushTimer: ReturnType<typeof setTimeout> | null;
  isFlushing: boolean;
  connectPromise: Promise<void> | null;
};

const globalAnalyticsState = globalThis as typeof globalThis & {
  __analyticsQueueState?: AnalyticsQueueState;
};

const queueState: AnalyticsQueueState =
  globalAnalyticsState.__analyticsQueueState ?? {
    queue: [],
    flushTimer: null,
    isFlushing: false,
    connectPromise: null,
  };

if (!globalAnalyticsState.__analyticsQueueState) {
  globalAnalyticsState.__analyticsQueueState = queueState;
}

function detectDevice(ua: string): "desktop" | "mobile" | "tablet" {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function isValidPayload(data: unknown): data is AnalyticsPayload {
  if (!data || typeof data !== "object") return false;
  const payload = data as Partial<AnalyticsPayload>;

  const validType = payload.type === "pageview" || payload.type === "web-vital";
  const validPath = typeof payload.path === "string" && payload.path.length > 0 && payload.path.length <= 1024;
  const validVisitorId =
    typeof payload.visitorId === "string" && payload.visitorId.length > 0 && payload.visitorId.length <= 128;

  return validType && validPath && validVisitorId;
}

async function ensureAnalyticsConnection() {
  if (!queueState.connectPromise) {
    queueState.connectPromise = dbConnect()
      .then(() => undefined)
      .catch((error) => {
        queueState.connectPromise = null;
        throw error;
      });
  }

  return queueState.connectPromise;
}

async function flushQueue() {
  if (queueState.isFlushing) {
    return;
  }

  queueState.isFlushing = true;

  if (queueState.flushTimer) {
    clearTimeout(queueState.flushTimer);
    queueState.flushTimer = null;
  }

  try {
    await ensureAnalyticsConnection();

    while (queueState.queue.length > 0) {
      const batch = queueState.queue.splice(0, FLUSH_BATCH_SIZE);
      await Analytics.collection.insertMany(batch, { ordered: false });
    }
  } catch (error) {
    console.error("Analytics batch flush failed:", error);
  } finally {
    queueState.isFlushing = false;

    if (queueState.queue.length > 0) {
      scheduleFlush(true);
    }
  }
}

function scheduleFlush(immediate = false) {
  if (immediate) {
    queueMicrotask(() => {
      void flushQueue();
    });
    return;
  }

  if (queueState.flushTimer) {
    return;
  }

  queueState.flushTimer = setTimeout(() => {
    queueState.flushTimer = null;
    void flushQueue();
  }, FLUSH_INTERVAL_MS);
}

function enqueueAnalytics(doc: AnalyticsInsert) {
  if (queueState.queue.length >= MAX_QUEUE_SIZE) {
    const overflow = queueState.queue.length - MAX_QUEUE_SIZE + 1;
    queueState.queue.splice(0, overflow);
  }

  queueState.queue.push(doc);

  if (queueState.queue.length >= FLUSH_BATCH_SIZE) {
    scheduleFlush(true);
    return;
  }

  scheduleFlush(false);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";

    enqueueAnalytics({
      type: body.type,
      path: body.path,
      visitorId: body.visitorId,
      referrer: body.referrer,
      userAgent,
      device: detectDevice(userAgent),
      metricName: body.metricName,
      metricValue: body.metricValue,
      metricRating: body.metricRating,
      timestamp: new Date(),
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    // Never block UX due to analytics ingestion failure.
    return new NextResponse(null, { status: 202 });
  }
}
