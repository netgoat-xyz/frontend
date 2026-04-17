"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AppSession = {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
} | null;

const AppSessionContext = createContext<AppSession | undefined>(undefined);

export function AppSessionProvider({
  session,
  children,
}: {
  session: AppSession;
  children: ReactNode;
}) {
  return (
    <AppSessionContext.Provider value={session}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  return useContext(AppSessionContext);
}
