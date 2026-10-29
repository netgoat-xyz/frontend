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
import Incident, {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from "@/models/Incident";

/**
 * Incident mutations.
 *
 * Previously unguarded and only partially editable. All of it is now
 * admin-guarded; a status change to `resolved` closes the incident with a
 * timestamp, and moving a resolved incident back to an open status reopens
 * it — state transitions the old console could not perform.
 */

const incidentInputSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  description: z.string().trim().min(1, "A description is required.").max(5000),
  status: z.enum(INCIDENT_STATUSES),
  severity: z.enum(INCIDENT_SEVERITIES),
});

export type IncidentInput = z.infer<typeof incidentInputSchema>;

function revalidateIncidents(): void {
  revalidatePath("/admin/incidents");
  revalidatePath("/status");
  revalidatePath("/dashboard", "layout");
}

export async function createIncidentAction(
  input: IncidentInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const parsed = incidentInputSchema.parse(input);
    await dbConnect();

    const resolved = parsed.status === "resolved";

    const incident = await Incident.create({
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      severity: parsed.severity,
      active: !resolved,
      resolvedAt: resolved ? new Date() : undefined,
    });

    revalidateIncidents();
    return { ok: true, data: { id: String(incident._id) } };
  } catch (error) {
    return toActionResult(error, "Could not create the incident.");
  }
}

const updateIncidentSchema = z.object({
  id: z.string().min(1),
  incident: incidentInputSchema,
});

export async function updateIncidentAction(input: {
  id: string;
  incident: IncidentInput;
}): Promise<ActionResult<{ active: boolean }>> {
  try {
    await assertAdmin();
    const parsed = updateIncidentSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That incident no longer exists.");
    }

    await dbConnect();

    const resolved = parsed.incident.status === "resolved";

    const updated = await Incident.updateOne(
      { _id: parsed.id },
      {
        $set: {
          title: parsed.incident.title,
          description: parsed.incident.description,
          status: parsed.incident.status,
          severity: parsed.incident.severity,
          active: !resolved,
          resolvedAt: resolved ? new Date() : null,
        },
      },
      { runValidators: true },
    );

    if (updated.matchedCount === 0) {
      throw new BusinessError("That incident no longer exists.");
    }

    revalidateIncidents();
    return { ok: true, data: { active: !resolved } };
  } catch (error) {
    return toActionResult(error, "Could not save the incident.");
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteIncidentAction(input: {
  id: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    await assertAdmin();
    const parsed = deleteSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That incident no longer exists.");
    }

    await dbConnect();
    const deleted = await Incident.deleteOne({ _id: parsed.id });
    if (deleted.deletedCount === 0) {
      throw new BusinessError("That incident no longer exists.");
    }

    revalidateIncidents();
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the incident.");
  }
}
