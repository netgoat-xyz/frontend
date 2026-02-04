"use client"

export default function Page() {
  if (process.env.NODE_ENV === "development") {
    throw new Error("client-side oops")
  }
  return null
}
