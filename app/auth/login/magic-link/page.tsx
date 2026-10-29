import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { getSessionUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Sign in with a magic link",
};

export default async function LoginMagicLinkPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return <MagicLinkForm mode="login" />;
}
