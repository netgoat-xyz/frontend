"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function EmailVerificationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.emailOtp.verifyEmail({ email, otp });
      setSuccess(true);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to resend code");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/25 filter backdrop-blur-md overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleVerify}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-muted-foreground text-balance">
                  Enter the code we sent to your email address
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
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
              {success && (
                <FieldDescription className="text-center text-green-500">
                  Email verified. Redirecting...
                </FieldDescription>
              )}
              {error && (
                <FieldDescription className="text-center text-red-500">
                  {error}
                </FieldDescription>
              )}
              <Field>
                <Button type="submit" className="cursor-pointer" disabled={loading}>
                  {loading ? "Verifying..." : "Verify email"}
                </Button>
              </Field>
              <Field>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={sending || !email}
                  onClick={handleResend}
                >
                  {sending ? "Sending..." : "Resend code"}
                </Button>
              </Field>
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
