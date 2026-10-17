import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NetGoat account.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}
