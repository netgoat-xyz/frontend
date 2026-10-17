"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard, AuthDivider, FormError } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 10;

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (signUpError) {
      setError(getErrorMessage(signUpError, "Unable to create your account."));
      setPending(false);
      return;
    }

    router.replace(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start routing traffic in minutes — no credit card required."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="register-name">Name</FieldLabel>
            <Input
              id="register-name"
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
              minLength={2}
              maxLength={64}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-email">Email</FieldLabel>
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-password">Password</FieldLabel>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>
              At least {MIN_PASSWORD_LENGTH} characters. Mix letters, numbers and
              symbols.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="register-confirm">Confirm password</FieldLabel>
            <Input
              id="register-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
        </div>

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Create account
        </Button>
      </form>

      <AuthDivider label="or sign up with" />
      <SocialButtons />

      <div className="text-muted-foreground flex flex-col gap-1 text-center text-sm">
        <p>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-xs">
          Prefer not to use a password?{" "}
          <Link
            href="/auth/register/magic-link"
            className="text-foreground underline-offset-4 hover:underline"
          >
            magic link
          </Link>{" "}
          or{" "}
          <Link
            href="/auth/register/otp"
            className="text-foreground underline-offset-4 hover:underline"
          >
            one-time code
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
