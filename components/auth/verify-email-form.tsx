"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard, FormError } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Email verification: confirms the account with the 6-digit code from the
 * verification email. When opened without an email (direct visit) it asks for
 * one and sends a fresh code.
 */
export function VerifyEmailForm({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(initialEmail ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setError(null);

    const { error: sendError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

    setPending(false);

    if (sendError) {
      setError(getErrorMessage(sendError, "Unable to send the code."));
      return;
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
    toastManager.add({
      type: "info",
      title: "Code sent",
      description: `We emailed a fresh verification code to ${email}.`,
    });
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Enter the 6-digit code from the verification email.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp: code,
    });

    if (verifyError) {
      setError(getErrorMessage(verifyError, "That code is not valid."));
      setCode("");
      setPending(false);
      return;
    }

    toastManager.add({ type: "success", title: "Email verified" });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Verify your email"
      description={
        email ? (
          <>
            Enter the 6-digit code we sent to <strong>{email}</strong> to
            activate your account.
          </>
        ) : (
          "Enter your email and we'll send a fresh verification code."
        )
      }
    >
      <form onSubmit={email ? verify : sendCode} className="flex flex-col gap-5">
        {email ? (
          <OtpInput value={code} onValueChange={setCode} disabled={pending} autoFocus />
        ) : (
          <Field>
            <FieldLabel htmlFor="verify-email">Email</FieldLabel>
            <Input
              id="verify-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FieldDescription>
              Use the address you registered with.
            </FieldDescription>
          </Field>
        )}

        <FormError message={error} />

        {email ? (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={pending}
            disabled={code.length !== 6}
          >
            Verify email
          </Button>
        ) : (
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            Email me a code
          </Button>
        )}
      </form>

      {email ? (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-foreground underline-offset-4 hover:underline disabled:opacity-64"
            disabled={cooldown > 0 || pending}
            onClick={() => sendCode()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            className="underline-offset-4 hover:underline"
            onClick={() => {
              setEmail("");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </div>
      ) : null}

      <div className="text-muted-foreground text-center text-xs">
        Wrong account?{" "}
        <Link
          href="/auth/login"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
