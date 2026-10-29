"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import {
  BusinessError,
  toActionResult,
  type ActionResult,
} from "@/lib/actions";
import { assertAdmin } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import Alert from "@/models/Alert";

/**
 * Platform alert mutations.
 *
 * The old app exposed these actions to anyone — create/delete were callable
 * unauthenticated. Every mutation here is admin-guarded and validated, and
 * alert content is editable instead of delete-and-recreate.
 */

const alertInputSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  body: z.string().trim().min(1, "A message is required.").max(2000),
  variant: z.enum(["red", "yellow", "blue"]),
  actionText: z.string().trim().max(80).optional().or(z.literal("")),
});

export type AlertInput = z.infer<typeof alertInputSchema>;

function revalidateAlerts(): void {
  revalidatePath("/admin/alerts");
  revalidatePath("/dashboard", "layout");
}

export async function createAlertAction(
  input: AlertInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const parsed = alertInputSchema.parse(input);
    await dbConnect();

    const alert = await Alert.create({
      title: parsed.title,
      body: parsed.body,
      variant: parsed.variant,
      actionText: parsed.actionText || "Dismiss",
      active: true,
    });

    revalidateAlerts();
    return { ok: true, data: { id: String(alert._id) } };
  } catch (error) {
    return toActionResult(error, "Could not create the alert.");
  }
}

const updateAlertSchema = z.object({
  id: z.string().min(1),
  alert: alertInputSchema,
});

export async function updateAlertAction(input: {
  id: string;
  alert: AlertInput;
}): Promise<ActionResult<{ updated: true }>> {
  try {
    await assertAdmin();
    const parsed = updateAlertSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That alert no longer exists.");
    }

    await dbConnect();
    const updated = await Alert.updateOne(
      { _id: parsed.id },
      {
        $set: {
          title: parsed.alert.title,
          body: parsed.alert.body,
          variant: parsed.alert.variant,
          actionText: parsed.alert.actionText || "Dismiss",
        },
      },
      { runValidators: true },
    );

    if (updated.matchedCount === 0) {
      throw new BusinessError("That alert no longer exists.");
    }

    revalidateAlerts();
    return { ok: true, data: { updated: true } };
  } catch (error) {
    return toActionResult(error, "Could not save the alert.");
  }
}

const toggleSchema = z.object({ id: z.string().min(1), active: z.boolean() });

export async function toggleAlertAction(input: {
  id: string;
  active: boolean;
}): Promise<ActionResult<{ active: boolean }>> {
  try {
    await assertAdmin();
    const parsed = toggleSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That alert no longer exists.");
    }

    await dbConnect();
    const updated = await Alert.updateOne(
      { _id: parsed.id },
      { $set: { active: parsed.active } },
    );

    if (updated.matchedCount === 0) {
      throw new BusinessError("That alert no longer exists.");
    }

    revalidateAlerts();
    return { ok: true, data: { active: parsed.active } };
  } catch (error) {
    return toActionResult(error, "Could not update the alert.");
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteAlertAction(input: {
  id: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    await assertAdmin();
    const parsed = deleteSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That alert no longer exists.");
    }

    await dbConnect();
    const deleted = await Alert.deleteOne({ _id: parsed.id });
    if (deleted.deletedCount === 0) {
      throw new BusinessError("That alert no longer exists.");
    }

    revalidateAlerts();
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the alert.");
  }
}
