import { redirect } from "next/navigation";
import type { Route } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AuthGate() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (session) {
    redirect("/dashboard/@me");
  }

  redirect("/auth/login" as Route);
}
