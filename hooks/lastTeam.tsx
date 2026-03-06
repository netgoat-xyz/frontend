"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function useLastTeamName() {
  const pathname = usePathname();
  const [lastTeam, setLastTeam] = useState<string | null>(null);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] === "dashboard" && segments[1] && segments[1] !== "teams") {
      const currentTeam = segments[1];
      setLastTeam(currentTeam);
      sessionStorage.setItem("lastTeamName", currentTeam);
    }
  }, [pathname]);

  useEffect(() => {
    if (!lastTeam) {
      const saved = sessionStorage.getItem("lastTeamName");
      if (saved) setLastTeam(saved);
    }
  }, [lastTeam]);

  return lastTeam;
}
