"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function useLastTeamName() {
  const pathname = usePathname();
  const [lastTeam, setLastTeam] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const segments = pathname.split("/").filter(Boolean);

      if (segments[0] === "dashboard" && segments[1] && segments[1] !== "teams") {
        const currentTeam = segments[1];
        sessionStorage.setItem("lastTeamName", currentTeam);
        setLastTeam(currentTeam);
      } else {
      const saved = sessionStorage.getItem("lastTeamName");
        setLastTeam(saved);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return lastTeam;
}
