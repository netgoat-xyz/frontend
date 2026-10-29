import { redirect } from "next/navigation";

/** Legacy alias: the generic magic-link route maps to the sign-in flow. */
export default function MagicLinkAliasPage() {
  redirect("/auth/login/magic-link");
}
