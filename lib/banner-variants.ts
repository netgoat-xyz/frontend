export const BANNER_VARIANTS: Record<string, { label: string, classes: string }> = {
  info: {
    label: "Info (Blue)",
    classes: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  },
  warning: {
    label: "Warning (Yellow)",
    classes: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  },
  error: {
    label: "Error (Red)",
    classes: "bg-red-500/10 text-red-500 border border-red-500/20",
  },
  success: {
    label: "Success (Green)",
    classes: "bg-green-500/10 text-green-500 border border-green-500/20",
  },
  announcement: {
    label: "Announcement (Purple)",
    classes: "bg-purple-500/10 text-purple-500 border border-purple-500/20 font-medium",
  },
  marketing: {
    label: "Marketing (Gradient)",
    classes: "bg-gradient-to-r from-pink-500/10 via-red-500/10 to-yellow-500/10 text-pink-500 border border-pink-500/20 font-medium",
  },
  rainbow: {
    label: "Rainbow",
    classes: "bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 border border-white/10 animate-pulse font-bold",
  },
  midnight: {
    label: "Midnight",
    classes: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
  }
};  

export type BannerVariant = keyof typeof BANNER_VARIANTS;
