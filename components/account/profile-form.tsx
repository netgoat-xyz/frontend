"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { authClient } from "@/lib/auth-client";

/** Display-name form for the profile page. */
export function ProfileForm({
  initialName,
  email,
  emailVerified,
}: {
  initialName: string;
  email: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dirty = name.trim() !== initialName && name.trim().length >= 2;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;

    setPending(true);
    setError(null);

    const { error: updateError } = await authClient.updateUser({
      name: name.trim(),
    });

    setPending(false);

    if (updateError) {
      setError(updateError.message ?? "Could not update your profile.");
      return;
    }

    toastManager.add({ type: "success", title: "Profile updated" });
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            How your name appears across the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={64}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input
              id="profile-email"
              name="email"
              type="email"
              value={email}
              readOnly
              disabled
            />
            <FieldDescription>
              {emailVerified
                ? "Verified — the address used for sign-in and alerts."
                : "Not verified yet. Verify from the banner after signing in."}
            </FieldDescription>
          </Field>

          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? <Spinner className="size-4" /> : null}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
