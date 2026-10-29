import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OtpForm } from "@/components/auth/otp-form";
import { getSessionUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Sign up with a code",
};

export default async function RegisterOtpPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return <OtpForm mode="register" />;
}
