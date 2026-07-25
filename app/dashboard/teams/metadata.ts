import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{
  teamName: string;
  section?: string[];
}>;

const dashboardPageKeys = [
  "overview",
  "integrations",
  "settings",
  "activity",
  "domains",
  "dns",
  "waf",
  "new",
] as const;

type DashboardPageKey = (typeof dashboardPageKeys)[number];

function isDashboardPageKey(value: string): value is DashboardPageKey {
  return (dashboardPageKeys as readonly string[]).includes(value);
}

export async function generateTeamMetadata(params: Params, pageOverride?: string): Promise<Metadata> {
  const resolvedParams = await params;
  const { teamName, section } = resolvedParams;
  const t = await getTranslations("DashboardMeta");

  const cleanTeam = decodeURIComponent(teamName).replace("@", "");
  const team = cleanTeam.charAt(0).toUpperCase() + cleanTeam.slice(1);

  const rawPage =
    pageOverride
      ? pageOverride
      : section && section.length > 0
        ? section[section.length - 1]
        : "overview";

  const toTitleCase = (value: string) =>
    value
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const pageTitles: Record<DashboardPageKey, string> = {
    overview: t("pages.overview"),
    integrations: t("pages.integrations"),
    settings: t("pages.settings"),
    activity: t("pages.activity"),
    domains: t("pages.domains"),
    dns: t("pages.dns"),
    waf: t("pages.waf"),
    new: t("pages.new"),
  };
  const pageTitle = isDashboardPageKey(rawPage) ? pageTitles[rawPage] : toTitleCase(rawPage);

  return {
    title: t("teamsTitleTemplate", { page: pageTitle }),
    description: t("descriptionTemplate", {
      team,
      page: pageTitle.toLowerCase(),
    }),
  };
}

export default async function generateMetadata({ params }: { params: Params }) {
  return generateTeamMetadata(params);
}
