"use client";

import { motion } from "motion/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared shell for every auth screen: animated entrance, consistent heading
 * scale and a max width that keeps forms scannable.
 */
export function AuthCard({
  title,
  description,
  children,
  className,
}: AuthCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn("flex w-full max-w-sm flex-col gap-7", className)}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-sm text-balance">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </motion.div>
  );
}

/** Inline error banner used by all auth forms. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Alert variant="error">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </motion.div>
  );
}

/** Horizontal "or continue with" divider. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div
      className="text-muted-foreground grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs"
      role="separator"
      aria-label={label}
    >
      <span aria-hidden="true" className="bg-border h-px w-full" />
      <span>{label}</span>
      <span aria-hidden="true" className="bg-border h-px w-full" />
    </div>
  );
}
