import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type NetgoatLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md";
  priority?: boolean;
};

const MARK_SIZE = { sm: 24, md: 28 } as const;

/**
 * NetGoat wordmark: the white ring mark on its dark tile plus the wordmark
 * rendered in the heading font so it stays crisp at any size.
 */
export function NetgoatLogo({
  className,
  href = "/",
  size = "md",
  priority,
}: NetgoatLogoProps) {
  const mark = MARK_SIZE[size];

  return (
    <Link
      href={href}
      aria-label="NetGoat home"
      className={cn(
        "focus-visible:ring-ring inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2",
        className,
      )}
    >
      <Image
        src="/branding/netgoat_ico.png"
        alt=""
        width={mark}
        height={mark}
        className="rounded-[7px]"
        priority={priority}
      />
      <span
        className={cn(
          "font-heading font-semibold tracking-tight",
          size === "sm" ? "text-base" : "text-lg",
        )}
      >
        NetGoat
      </span>
    </Link>
  );
}
