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

export type MagicLinkFormMode = "login" | "register";

export default function MagicLinkForm({
  className,
  mode,
  ...props
}: React.ComponentProps<"div"> & { mode: MagicLinkFormMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const backPath = mode === "register" ? "/auth/register" : "/auth/login";
  const errorCallbackURL =
    mode === "register" ? "/auth/register/magic-link" : "/auth/login/magic-link";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.magicLink({
        email,
        name: mode === "register" ? name : undefined,
        callbackURL: "/dashboard",
        newUserCallbackURL: "/dashboard",
        errorCallbackURL,
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/25 filter backdrop-blur-md overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">
                  {mode === "register" ? "Create your account" : "Magic link sign in"}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {mode === "register"
                    ? "We will email you a sign in link"
                    : "We will email you a sign in link"}
                </p>
              </div>
              {mode === "register" && (
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
              {sent && (
                <FieldDescription className="text-center text-green-500">
                  Check your email for a magic link.
                </FieldDescription>
              )}
              {error && (
                <FieldDescription className="text-center text-red-500">
                  {error}
                </FieldDescription>
              )}
              <Field>
                <Button type="submit" className="cursor-pointer" disabled={loading}>
                  {loading ? "Sending..." : "Send magic link"}
                </Button>
              </Field>
              <FieldSeparator>More options</FieldSeparator>
              <FieldDescription className="text-center">
                Prefer a code? <Link href={backPath + "/otp"}>Use OTP</Link>
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
