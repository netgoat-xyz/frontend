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
import Link from "next/dist/client/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.email({ email, password });
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
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
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Netgoat account
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
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <FieldDescription className="text-center">
                Prefer passwordless?{" "}
                <Link href="/auth/login/magic-link">Magic link</Link> or{" "}
                <Link href="/auth/login/otp">OTP</Link>.
              </FieldDescription>
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
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Field className="grid grid-cols-3 gap-4">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  type="button"
                  onClick={async () =>
                    await authClient.signIn.social({
                      provider: "discord",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  <img
                    src="/brands/Discord/Discord_idk1kDTKQj_0.svg"
                    alt="Discord"
                    className="cursor-pointer h-5 w-5 mx-auto"
                  />
                  <span className="sr-only">Login with Discord</span>
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  type="button"
                  onClick={async () =>
                    await authClient.signIn.social({
                      provider: "github",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  <img
                    src="/brands/GitHub/GitHub_Symbol_0.svg"
                    alt="Github"
                    className="cursor-pointer h-5 w-5 mx-auto"
                  />
                  <span className="sr-only">Login with Github</span>
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  type="button"
                  onClick={async () =>
                    await authClient.signIn.social({
                      provider: "gitlab",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  <img
                    src="/brands/GitLab/GitLab_Symbol_0.svg"
                    alt="Gitlab"
                    className="cursor-pointer h-5 w-5 mx-auto"
                  />
                  <span className="sr-only">Login with Gitlab</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register">Sign up</Link>
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
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
