"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Types } from "mongoose";
import { z } from "zod";

import {
  BusinessError,
  toActionResult,
  type ActionResult,
} from "@/lib/actions";
import { assertAdmin, getSessionUser } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import Feedback, { FEEDBACK_STATUSES } from "@/models/Feedback";

/**
 * Feedback intake and triage.
 *
 * `submitFeedbackAction` is intentionally public, so it is hardened instead:
 * bounded input, a best-effort per-IP throttle, and session enrichment only
 * when a session exists.
 */

const FEEDBACK_RATE_WINDOW_MS = 10 * 60 * 1000;
const FEEDBACK_RATE_LIMIT = 5;

const globalForFeedback = globalThis as typeof globalThis & {
  __feedbackRate?: Map<string, { count: number; resetAt: number }>;
};
const rateBuckets =
  globalForFeedback.__feedbackRate ?? new Map<string, { count: number; resetAt: number }>();
globalForFeedback.__feedbackRate = rateBuckets;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(key);

  if (!entry || entry.resetAt <= now) {
    if (rateBuckets.size >= 5000) {
      for (const [bucketKey, bucket] of rateBuckets) {
        if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
      }
    }
    rateBuckets.set(key, { count: 1, resetAt: now + FEEDBACK_RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > FEEDBACK_RATE_LIMIT;
}

const submitSchema = z.object({
  message: z
    .string()
    .trim()
    .min(5, "Please write at least a few words.")
    .max(5000, "Feedback is too long."),
  category: z.enum(["bug", "idea", "praise", "other"]).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(320).optional(),
  path: z.string().trim().max(1024).optional(),
});

export async function submitFeedbackAction(input: {
  message: string;
  category?: "bug" | "idea" | "praise" | "other";
  email?: string;
  path?: string;
}): Promise<ActionResult<{ received: true }>> {
  try {
    const parsed = submitSchema.parse(input);
    const requestHeaders = await headers();

    const forwarded = requestHeaders.get("x-forwarded-for");
    const clientKey =
      forwarded?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(clientKey)) {
      throw new BusinessError(
        "You have sent several messages already — please try again later.",
      );
    }

    const sessionUser = await getSessionUser();
    await dbConnect();

    await Feedback.create({
      message: parsed.message,
      category: parsed.category ?? "other",
      email: parsed.email || sessionUser?.email || undefined,
      userId: sessionUser?.id,
      userName: sessionUser?.name,
      path: parsed.path,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 512),
      status: "new",
    });

    return { ok: true, data: { received: true } };
  } catch (error) {
    return toActionResult(error, "Could not send your feedback. Please try again.");
  }
}

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(FEEDBACK_STATUSES),
});

export async function setFeedbackStatusAction(input: {
  id: string;
  status: (typeof FEEDBACK_STATUSES)[number];
}): Promise<ActionResult<{ status: string }>> {
  try {
    await assertAdmin();
    const parsed = statusSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That entry no longer exists.");
    }

    await dbConnect();
    const updated = await Feedback.updateOne(
      { _id: parsed.id },
      { $set: { status: parsed.status } },
    );

    if (updated.matchedCount === 0) {
      throw new BusinessError("That entry no longer exists.");
    }

    revalidatePath("/admin/feedback");
    return { ok: true, data: { status: parsed.status } };
  } catch (error) {
    return toActionResult(error, "Could not update the entry.");
  }
}

export async function deleteFeedbackAction(input: {
  id: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    await assertAdmin();
    const parsed = z.object({ id: z.string().min(1) }).parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That entry no longer exists.");
    }

    await dbConnect();
    const deleted = await Feedback.deleteOne({ _id: parsed.id });
    if (deleted.deletedCount === 0) {
      throw new BusinessError("That entry no longer exists.");
    }

    revalidatePath("/admin/feedback");
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the entry.");
  }
}
