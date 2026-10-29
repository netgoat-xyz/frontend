import type { Metadata } from "next";
import { headers } from "next/headers";

import { PasswordForm } from "@/components/account/password-form";
import {
  SessionsList,
  type SessionInfo,
} from "@/components/account/sessions-list";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Security",
};

export default async function AccountSecurityPage() {
  await requireUser();

  const requestHeaders = await headers();
  const [current, sessions] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listSessions({ headers: requestHeaders }),
  ]);

  const currentToken = current?.session?.token;

  const sessionInfos: SessionInfo[] = sessions
    .map((session) => ({
      token: session.token,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      current: session.token === currentToken,
    }))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  return (
    <div className="flex flex-col gap-6">
      <PasswordForm />
      <SessionsList sessions={sessionInfos} />
    </div>
  );
}
