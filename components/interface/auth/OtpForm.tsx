"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type OtpFormMode = "login" | "register";

export default function OtpForm({
  className,
  mode,
  ...props
}: React.ComponentProps<"div"> & { mode: OtpFormMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const backPath = mode === "register" ? "/auth/register" : "/auth/login";

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setStep("verify");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.emailOtp({ email, otp });
      if (mode === "register" && name) {
        await authClient.updateUser({ name });
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/25 filter backdrop-blur-md overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={step === "request" ? handleRequest : handleVerify}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">One-time passcode</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your email and we will send a one-time code
                </p>
              </div>
              {mode === "register" && step === "request" && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="DuckyMcDuckFace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              )}
              {step === "request" ? (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="otp">Code</FieldLabel>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </Field>
              )}
              {error && (
                <FieldDescription className="text-center text-red-500">
                  {error}
                </FieldDescription>
              )}
              <Field>
                <Button type="submit" className="cursor-pointer" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : step === "request"
                      ? "Send code"
                      : "Verify code"}
                </Button>
              </Field>
              <FieldSeparator>More options</FieldSeparator>
              <FieldDescription className="text-center">
                Prefer a link? <Link href={backPath + "/magic-link"}>Use magic link</Link>
              </FieldDescription>
              <FieldDescription className="text-center">
                Use a password instead? <Link href={backPath}>Go back</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted/25 filter backdrop-blur-md relative hidden md:block">
            <Image
              src="/ui_images/AuthImage.png"
              width={5000}
              height={5000}
              alt="Image"
              className="absolute inset-0 h-full select-none pointer-events-none w-full object-cover dark:brightness-[0.2] dark:grayscale"
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
