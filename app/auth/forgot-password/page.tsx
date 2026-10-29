import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getSessionUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return <ForgotPasswordForm />;
}
