"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/** Small ghost button that copies a value and confirms with a tick. */
export function CopyButton({
  value,
  label = "value",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; the value stays selectable manually.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      onClick={copy}
    >
      {copied ? (
        <HugeiconsIcon icon={Tick02Icon} className="text-success" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} />
      )}
    </Button>
  );
}
