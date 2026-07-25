"use client";

import { cn, getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/dist/client/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      setStep("otp");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // The better-auth emailOTP plugin client endpoint is usually .resetPassword 
      await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-card/25 filter backdrop-blur-md overflow-hidden p-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Password Reset Successful</h2>
            <p className="text-muted-foreground mb-4">You can now login with your new password.</p>
            <Button>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/25 filter backdrop-blur-md overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {step === "email" ? (
            <form className="p-6 md:p-8" onSubmit={handleSendOtp}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Forgot Password</h1>
                  <p className="text-muted-foreground text-balance">
                    Enter your email to receive a reset code
                  </p>
                </div>
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
                {error && (
                  <FieldDescription className="text-red-500 text-center">
                    {error}
                  </FieldDescription>
                )}
                <Field>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </Field>
                <FieldDescription className="text-center mt-4">
                  Remember your password?{" "}
                  <Link href="/auth/login">Login</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          ) : (
            <form className="p-6 md:p-8" onSubmit={handleResetPassword}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Reset Password</h1>
                  <p className="text-muted-foreground text-balance">
                    Enter the code sent to your email and your new password
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="otp">Reset Code</FieldLabel>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                {error && (
                  <FieldDescription className="text-red-500 text-center">
                    {error}
                  </FieldDescription>
                )}
                <Field>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Field>
                <FieldDescription className="text-center mt-4">
                  <button type="button" onClick={() => setStep("email")} className="text-muted-foreground underline">
                    Go back
                  </button>
                </FieldDescription>
              </FieldGroup>
            </form>
          )}
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
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
