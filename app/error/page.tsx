"use client"

export default function Page() {
  if (process.env.NODE_ENV === "development" || !window.__NEXT_DATA__.isFallback) {
    throw new Error("client-side oops")
  }
  return null
}
