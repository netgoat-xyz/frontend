"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { renameTeamAction } from "@/actions/teams";
import { FormError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";

/** Rename form for the team settings page. */
export function TeamSettingsForm({
  teamSlug,
  initialName,
  canEdit,
}: {
  teamSlug: string;
  initialName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dirty = name.trim() !== initialName && name.trim().length >= 2;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || !dirty) return;

    setPending(true);
    setError(null);

    const result = await renameTeamAction({ teamSlug, name: name.trim() });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({ type: "success", title: "Team renamed" });
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Shown across the dashboard and in invitations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="team-name">Team name</FieldLabel>
            <Input
              id="team-name"
              name="name"
              required
              minLength={2}
              maxLength={48}
              disabled={!canEdit}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <FieldDescription>
              {canEdit
                ? "2–48 characters. Changes apply immediately."
                : "Your role does not allow changing team settings."}
            </FieldDescription>
          </Field>

          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!dirty || pending || !canEdit}>
            {pending ? <Spinner className="size-4" /> : null}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
