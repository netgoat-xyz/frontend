"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

type ViewTransitionClass = "auto" | "none" | (string & {});

type ViewTransitionProps = {
  children?: React.ReactNode;
  name?: string;
  default?: ViewTransitionClass;
  enter?: ViewTransitionClass;
  exit?: ViewTransitionClass;
  share?: ViewTransitionClass;
};

/**
 * `ViewTransition` ships with the React canary release that the App Router
 * bundles, but the published @types/react doesn't declare it yet — read it
 * off the namespace instead of importing it by name.
 */
export const ViewTransition = (
  React as unknown as {
    ViewTransition: React.ComponentType<ViewTransitionProps>;
  }
).ViewTransition;

/**
 * Crossfades the content region on route changes while the persistent shell
 * (sidebar, top bar) stays still. The boundary is named and keyed by
 * pathname, so a navigation deletes the old boundary and inserts a new one
 * with the same name — React pairs them and plays the `page-morph` share
 * animation defined in globals.css. Server-action refreshes and in-page
 * filter updates re-render the same boundary without animating.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      default="none"
      enter="page-enter"
      exit="page-exit"
      key={pathname}
    >
      {children}
    </ViewTransition>
  );
}
