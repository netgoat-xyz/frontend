"use client";

import React, { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-08-02T07:00:00Z").getTime();

export default function LaunchWrapper({ children }: { children: React.ReactNode }) {
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    const checkDate = () => {
      setIsLaunched(Date.now() >= TARGET_DATE);
    };
    checkDate();
    const interval = setInterval(checkDate, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLaunched) {
    return null;
  }

  return <>{children}</>;
}
