"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  validateDynamicRulesConfig,
  normalizeDynamicRulesConfig,
  type DynamicRulesConfig,
} from "@/lib/agent-config";
import {
  BusinessError,
  toActionResult,
  type ActionResult,
} from "@/lib/actions";
import { assertAdmin } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import { settingsUpdateSchema } from "@/lib/validation/settings";
import Settings from "@/models/Settings";

/**
 * Platform settings mutations.
 *
 * Both actions are admin-guarded and validate server-side; the settings form
 * can only touch the fields in `settingsUpdateSchema`, and dynamic rules go
 * through the same limit checks agents rely on.
 */

export async function updateSettingsAction(
  input: z.input<typeof settingsUpdateSchema>,
): Promise<ActionResult<{ saved: true }>> {
  try {
    await assertAdmin();
    const parsed = settingsUpdateSchema.parse(input);
    await dbConnect();

    await Settings.findOneAndUpdate(
      {},
      { $set: { ...parsed } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    // Layout scope covers the marketing chrome (site name, banner) as well as
    // the admin form itself.
    revalidatePath("/", "layout");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionResult(error, "Could not save the settings.");
  }
}

export async function updateDynamicRulesAction(
  input: unknown,
): Promise<ActionResult<DynamicRulesConfig>> {
  try {
    await assertAdmin();

    const errors = validateDynamicRulesConfig(input);
    if (errors.length > 0) {
      throw new BusinessError(errors.join(" "));
    }

    const normalized = normalizeDynamicRulesConfig(input);
    await dbConnect();

    await Settings.findOneAndUpdate(
      {},
      { $set: { "agentConfig.dynamic_rules": normalized } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    revalidatePath("/admin/settings");
    return { ok: true, data: normalized };
  } catch (error) {
    return toActionResult(error, "Could not save the dynamic rules.");
  }
}
