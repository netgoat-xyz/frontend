"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard, FormError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

import type { OtpMode } from "@/components/auth/otp-form";

/**
 * Magic-link flow: submit an email, better-auth mails a single-use link and we
 * confirm the delivery state without leaking whether the account exists.
 */
export function MagicLinkForm({ mode }: { mode: OtpMode }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const { error: sendError } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });

    setPending(false);

    if (sendError) {
      setError(getErrorMessage(sendError, "Unable to send the link."));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        description={
          <>
            If an account exists for <strong>{email}</strong>, a sign-in link is
            on its way. The link expires in 5 minutes.
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setSent(false);
              setError(null);
            }}
          >
            Use a different email
          </Button>

          <div className="text-muted-foreground text-center text-xs">
            No email after a minute?{" "}
            <button
              type="button"
              className="text-foreground underline-offset-4 hover:underline"
              onClick={() => setSent(false)}
            >
              try again
            </button>{" "}
            or use{" "}
            <Link
              href={mode === "register" ? "/auth/register/otp" : "/auth/login/otp"}
              className="text-foreground underline-offset-4 hover:underline"
            >
              a one-time code
            </Link>
            .
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={mode === "register" ? "Sign up with a link" : "Sign in with a link"}
      description="We'll email you a single-use link that signs you straight in."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field>
          <FieldLabel htmlFor="magic-email">Email</FieldLabel>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Email me a sign-in link
        </Button>
      </form>

      <div className="text-muted-foreground text-center text-xs">
        Prefer a code?{" "}
        <Link
          href={mode === "register" ? "/auth/register/otp" : "/auth/login/otp"}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Use a one-time code
        </Link>{" "}
        · Use a password?{" "}
        <Link
          href={mode === "register" ? "/auth/register" : "/auth/login"}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Go back
        </Link>
      </div>
    </AuthCard>
  );
}
