"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard, FormError } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

export type OtpMode = "login" | "register";

const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Passwordless sign-in with a 6-digit email code. Register mode also asks for
 * a display name and writes it after the code is verified.
 */
export function OtpForm({ mode }: { mode: OtpMode }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
        type: "sign-in",
      });

    if (sendError) {
      setError(getErrorMessage(sendError, "Unable to send the code."));
      setPending(false);
      return;
    }

    setStep("code");
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setPending(false);
    toastManager.add({
      type: "info",
      title: "Code sent",
      description: `We emailed a 6-digit code to ${email}.`,
    });
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: verifyError } = await authClient.signIn.emailOtp({
      email,
      otp: code,
    });

    if (verifyError) {
      setError(getErrorMessage(verifyError, "That code is not valid."));
      setCode("");
      setPending(false);
      return;
    }

    if (mode === "register" && name.trim()) {
      await authClient.updateUser({ name: name.trim() });
    }

    toastManager.add({
      type: "success",
      title: mode === "register" ? "Account ready" : "Welcome back",
    });
    router.replace("/dashboard");
    router.refresh();
  }

  if (step === "email") {
    return (
      <AuthCard
        title={mode === "register" ? "Sign up with a code" : "Sign in with a code"}
        description="We'll email you a 6-digit code — no password needed."
      >
        <form onSubmit={sendCode} className="flex flex-col gap-5" noValidate={false}>
          <div className="flex flex-col gap-4">
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="otp-name">Name</FieldLabel>
                <Input
                  id="otp-name"
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
            ) : null}

            <Field>
              <FieldLabel htmlFor="otp-email">Email</FieldLabel>
              <Input
                id="otp-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
          </div>

          <FormError message={error} />

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            Email me a code
          </Button>
        </form>

        <div className="text-muted-foreground text-center text-xs">
          Prefer a link?{" "}
          <Link
            href={mode === "register" ? "/auth/register/magic-link" : "/auth/login/magic-link"}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Use a magic link
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

  return (
    <AuthCard
      title="Enter your code"
      description={
        <>
          We sent a 6-digit code to <strong>{email}</strong>.
        </>
      }
    >
      <form onSubmit={verifyCode} className="flex flex-col gap-5">
        <OtpInput value={code} onValueChange={setCode} disabled={pending} autoFocus />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={pending}
          disabled={code.length !== 6}
        >
          Verify and continue
        </Button>

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
