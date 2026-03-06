"use client";

import { BANNER_VARIANTS, BannerVariant } from "@/lib/banner-variants";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface GlobalBannerProps {
  settings: any;
  doNotShowBanner?: string[];
}

export default function GlobalBanner({ settings, doNotShowBanner = [] }: GlobalBannerProps) {
  const pathname = usePathname();

  if (!settings?.globalBannerEnabled || !settings?.globalBannerText) {
    return null;
  }

  if (doNotShowBanner.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  const variantKey = (settings.globalBannerVariant || "info") as BannerVariant;
  const variant = BANNER_VARIANTS[variantKey] || BANNER_VARIANTS.info;

  return (
    <div className={cn("w-full py-2 px-4 text-center text-sm z-50", variant.classes)}>
      {settings.globalBannerText}
    </div>
  );
}
