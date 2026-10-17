import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth-guards";

export default async function AuthGatePage() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/auth/login");
}
