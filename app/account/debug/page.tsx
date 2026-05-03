import { getExperiments } from "@/actions/experiments";
import TestBillingPage from "../test-billing/page";
import { redirect } from "next/navigation";

function isDeveloperModeTestingEnabled(
  flags: Record<string, boolean | string> | null | undefined,
) {
  const rawValue =
    flags?.Developer_Mode_Testing ??
    flags?.developer_mode_testing ??
    flags?.DEVELOPER_MODE_TESTING;

  if (rawValue === true) {
    return true;
  }

  if (typeof rawValue === "string") {
    return rawValue.trim().toLowerCase() === "true";
  }

  return false;
}

export default async function AccountDebugPage() {
  const flags = (await getExperiments().catch(() => null)) as
    | Record<string, boolean | string>
    | null;

  if (!isDeveloperModeTestingEnabled(flags)) {
    redirect("/account/settings");
  }

  return <TestBillingPage />;
}