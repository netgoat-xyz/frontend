"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Building03Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createTeamAction } from "@/actions/teams";
import { FormError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";

/** Create a team; on success the user lands on the new workspace. */
export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createTeamAction({ name });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({ type: "success", title: "Team created" });
    router.push(`/dashboard/${result.data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="team-name">Team name</FieldLabel>
        <Input
          id="team-name"
          name="name"
          placeholder="Acme Infrastructure"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={48}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldDescription>
          You&apos;ll be the owner. Invite teammates and set roles from team
          settings afterwards.
        </FieldDescription>
      </Field>

      <FormError message={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} />
          )}
          Create team
        </Button>
        <Button variant="ghost" render={<Link href="/dashboard/teams" />}>
          Cancel
        </Button>
        <span className="text-muted-foreground ms-auto flex items-center gap-1.5 text-xs">
          <HugeiconsIcon icon={Building03Icon} className="size-3.5" />
          Comes with its own billing and domains
        </span>
      </div>
    </form>
  );
}
