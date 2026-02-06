import { getPublicSettings } from "@/actions/adminValues";
import { BANNER_VARIANTS, BannerVariant } from "@/lib/banner-variants";
import { cn } from "@/lib/utils";

export default async function GlobalBanner() {
  try {
    const settings = await getPublicSettings();

    if (!settings?.globalBannerEnabled || !settings?.globalBannerText) {
      return null;
    }

    const variantKey = (settings.globalBannerVariant || "info") as BannerVariant;
    const variant = BANNER_VARIANTS[variantKey] || BANNER_VARIANTS.info;

    return (
      <div className={cn("w-full py-2 px-4 text-center text-sm z-50", variant.classes)}>
        {settings.globalBannerText}
      </div>
    );
  } catch (e) {
    return null; // DB might not be ready
  }
}
