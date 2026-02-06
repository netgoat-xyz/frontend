export const BANNER_VARIANTS: Record<string, { label: string, classes: string }> = {
  info: {
    label: "Info (Blue)",
    classes: "bg-blue-600 text-white",
  },
  warning: {
    label: "Warning (Yellow)",
    classes: "bg-yellow-500 text-black",
  },
  error: {
    label: "Error (Red)",
    classes: "bg-red-600 text-white",
  },
  success: {
    label: "Success (Green)",
    classes: "bg-green-600 text-white",
  },
  announcement: {
    label: "Announcement (Purple)",
    classes: "bg-purple-600 text-white font-bold",
  },
  marketing: {
    label: "Marketing (Gradient)",
    classes: "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold",
  },
  rainbow: {
    label: "Rainbow",
    classes: "bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white animate-pulse",
  },
  midnight: {
    label: "Midnight",
    classes: "bg-neutral-900 border-b border-neutral-800 text-neutral-200",
  }
};  

export type BannerVariant = keyof typeof BANNER_VARIANTS;
