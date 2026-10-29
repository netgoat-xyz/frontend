import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens — one source of truth for timing across the app so every
 * surface feels like it belongs to the same product.
 */

export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.45, 0, 0.55, 1] as const;

export const springs = {
  /** Page/section entrances — settles quickly without overshoot. */
  soft: { type: "spring", stiffness: 380, damping: 32 } satisfies Transition,
  /** Buttons, popovers, small controls — immediate response. */
  snappy: { type: "spring", stiffness: 520, damping: 36 } satisfies Transition,
  /** Larger panels that should feel weighty. */
  gentle: { type: "spring", stiffness: 260, damping: 30 } satisfies Transition,
} as const;

export const durations = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.28,
  slow: 0.45,
} as const;

/** Fade + rise. Used for cards, sections and page content. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easeOut },
  },
};

/** Plain fade. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.normal, ease: easeOut } },
};

/** Slight scale-in for compact surfaces (menus, badges, cards). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.fast, ease: easeOut },
  },
};

/** Parent container that staggers its children. */
export const stagger = (staggerChildren = 0.06, delayChildren = 0.04): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

/** Standard child item for use inside a `stagger()` container. */
export const staggerItem: Variants = fadeUp;

/** Standard enter/exit for overlays and dismissible surfaces. */
export const surfaceMotion = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
  transition: { duration: durations.fast, ease: easeOut },
} as const;

/** Shared viewport config so scroll-triggered motion feels consistent. */
export const inViewOnce = { once: true, margin: "0px 0px -80px 0px" } as const;
