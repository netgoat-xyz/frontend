import type { QueryFilter } from "mongoose";

import dbConnect from "@/lib/mongoose";
import Feedback, {
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackDocument,
  type FeedbackStatus,
} from "@/models/Feedback";

export const FEEDBACK_PAGE_SIZE = 20;

export type FeedbackView = {
  id: string;
  message: string;
  category: FeedbackCategory;
  email: string | null;
  userName: string | null;
  userId: string | null;
  path: string | null;
  status: FeedbackStatus;
  createdAt: string;
};

export type FeedbackPage = {
  entries: FeedbackView[];
  total: number;
  page: number;
  pages: number;
  counts: { new: number; reviewed: number; archived: number };
};

type RawFeedback = {
  _id: unknown;
  message?: string;
  category?: string;
  email?: string;
  userName?: string;
  userId?: string;
  path?: string;
  status?: string;
  createdAt?: Date;
};

function toView(entry: RawFeedback): FeedbackView {
  return {
    id: String(entry._id),
    message: entry.message ?? "",
    category: (["bug", "idea", "praise", "other"] as const).includes(
      entry.category as FeedbackCategory,
    )
      ? (entry.category as FeedbackCategory)
      : "other",
    email: entry.email || null,
    userName: entry.userName || null,
    userId: entry.userId || null,
    path: entry.path || null,
    status: (FEEDBACK_STATUSES as readonly string[]).includes(entry.status ?? "")
      ? (entry.status as FeedbackStatus)
      : "new",
    createdAt: (entry.createdAt ?? new Date(0)).toISOString(),
  };
}

const FEEDBACK_PROJECTION =
  "message category email userName userId path status createdAt";

/** Paginated feedback list with per-status counts for the console tabs. */
export async function listFeedback(input: {
  status?: FeedbackStatus | "all";
  page?: number;
  limit?: number;
}): Promise<FeedbackPage> {
  await dbConnect();

  const filter: QueryFilter<FeedbackDocument> = {};
  if (input.status && input.status !== "all") filter.status = input.status;

  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Math.floor(input.limit ?? FEEDBACK_PAGE_SIZE)),
  );

  const [total, counts, docs] = await Promise.all([
    Feedback.countDocuments(filter),
    Feedback.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(FEEDBACK_PROJECTION)
      .lean<RawFeedback[]>(),
  ]);

  const countMap = { new: 0, reviewed: 0, archived: 0 };
  for (const row of counts) {
    if (row._id === "new" || row._id === "reviewed" || row._id === "archived") {
      countMap[row._id] = row.count ?? 0;
    }
  }

  return {
    entries: docs.map(toView),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts: countMap,
  };
}
