"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard, AuthDivider, FormError } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      const message = getErrorMessage(signInError, "Unable to sign in.");
      // Unverified accounts are routed straight into the verification flow.
      if (/verif/i.test(message)) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(message);
      setPending(false);
      return;
    }

    toastManager.add({ type: "success", title: "Welcome back" });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your domains, traffic and team."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
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
            <div className="flex w-full items-center justify-between">
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Link
                href="/auth/forgot-password"
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </div>

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>

      <AuthDivider label="or continue with" />
      <SocialButtons />

      <div className="text-muted-foreground flex flex-col gap-1 text-center text-sm">
        <p>
          New to NetGoat?{" "}
          <Link
            href="/auth/register"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p className="text-xs">
          Passwordless options:{" "}
          <Link
            href="/auth/login/magic-link"
            className="text-foreground underline-offset-4 hover:underline"
          >
            magic link
          </Link>{" "}
          or{" "}
          <Link
            href="/auth/login/otp"
            className="text-foreground underline-offset-4 hover:underline"
          >
            one-time code
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
