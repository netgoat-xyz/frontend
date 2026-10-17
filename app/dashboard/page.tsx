import { redirect } from "next/navigation";

/** Landing route: send users straight to their personal team workspace. */
export default function DashboardIndexPage() {
  redirect("/dashboard/@me");
}
