import { getTranslations } from "next-intl/server";

export default async function DashboardHome() {
  const t = await getTranslations("DashboardPages.activity");

  return (
      <div className="text-sm text-muted-foreground">{t("title")}</div>
  );
}
