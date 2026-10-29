"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon } from "@hugeicons/core-free-icons";
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

const MIN_PASSWORD_LENGTH = 10;

/** Password change with session revocation on success. */
export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setPending(false);

    if (changeError) {
      setError(changeError.message ?? "Could not change your password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    toastManager.add({
      type: "success",
      title: "Password updated",
      description: "Other devices were signed out.",
    });
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={LockKeyIcon} className="size-4" />
            Password
          </CardTitle>
          <CardDescription>
            Changing your password signs out every other device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input
              id="current-password"
              name="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <FieldDescription>
                At least {MIN_PASSWORD_LENGTH} characters.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>
          </div>

          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={pending || !currentPassword || !newPassword || !confirm}
          >
            {pending ? <Spinner className="size-4" /> : null}
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
