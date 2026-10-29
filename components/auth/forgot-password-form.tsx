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

const MIN_PASSWORD_LENGTH = 10;
const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Two-step password reset: request a code, then set a new password using that
 * code. All verification happens server-side against the hashed OTP.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setError(null);

    const { error: sendError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });

    setPending(false);

    if (sendError) {
      setError(getErrorMessage(sendError, "Unable to send the code."));
      return;
    }

    setStep("reset");
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toastManager.add({
      type: "info",
      title: "Code sent",
      description: `If an account exists for ${email}, a reset code is on its way.`,
    });
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }

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

    const { error: resetError } = await authClient.emailOtp.resetPassword({
      email,
      otp: code,
      password,
    });

    if (resetError) {
      setError(
        getErrorMessage(resetError, "That code is not valid or has expired."),
      );
      setCode("");
      setPending(false);
      return;
    }

    toastManager.add({
      type: "success",
      title: "Password updated",
      description: "Sign in with your new password.",
    });
    router.replace("/auth/login");
  }

  if (step === "email") {
    return (
      <AuthCard
        title="Reset your password"
        description="We'll email you a 6-digit code to verify it's really you."
      >
        <form onSubmit={requestCode} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
            <Input
              id="forgot-email"
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
            Send reset code
          </Button>
        </form>

        <div className="text-muted-foreground text-center text-xs">
          Remembered it?{" "}
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

  return (
    <AuthCard
      title="Choose a new password"
      description={
        <>
          Enter the code sent to <strong>{email}</strong> and your new password.
        </>
      }
    >
      <form onSubmit={resetPassword} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <OtpInput value={code} onValueChange={setCode} disabled={pending} autoFocus />

          <Field>
            <FieldLabel htmlFor="forgot-password">New password</FieldLabel>
            <Input
              id="forgot-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>
              At least {MIN_PASSWORD_LENGTH} characters.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="forgot-confirm">Confirm new password</FieldLabel>
            <Input
              id="forgot-confirm"
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={pending}
          disabled={code.length !== 6}
        >
          Update password
        </Button>

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-foreground underline-offset-4 hover:underline disabled:opacity-64"
            disabled={cooldown > 0 || pending}
            onClick={() => requestCode()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            className="underline-offset-4 hover:underline"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
