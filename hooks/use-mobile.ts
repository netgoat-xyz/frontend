import { useEffect, useState } from "react"

/**
 * useIsMobile - React hook to detect if the current viewport is mobile-sized.
 * Returns true if window.innerWidth <= 768px (tailwind md breakpoint).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  )

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}
