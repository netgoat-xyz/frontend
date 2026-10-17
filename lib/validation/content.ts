import { z } from "zod";

import { POST_TYPES } from "@/lib/content";

/** Cover images are either site-relative or plain http(s) URLs. */
const coverImageSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/") ||
      /^https?:\/\//i.test(value),
    "Use a site path or an http(s) URL.",
  );

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slugs use lowercase letters, numbers and dashes.",
    )
    .optional()
    .or(z.literal("")),
  content: z.string().min(1, "Content cannot be empty.").max(500_000),
  type: z.enum(POST_TYPES),
  published: z.boolean(),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  coverImage: coverImageSchema.optional().or(z.literal("")),
  version: z.string().trim().max(50).optional().or(z.literal("")),
  author: z.string().trim().max(120).optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postInputSchema>;
