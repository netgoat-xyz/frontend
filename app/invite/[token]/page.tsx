"use client";

import { acceptInvite } from "@/actions/teams";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type InviteState = "loading" | "success" | "error";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  const [state, setState] = useState<InviteState>("loading");
  const [message, setMessage] = useState("Accepting your invite...");
  const [teamSlug, setTeamSlug] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const accept = async () => {
      if (!token) {
        setState("error");
        setMessage("Invite token is missing.");
        return;
      }

      try {
        const result = await acceptInvite(token);
        if (!mounted) return;

        setTeamSlug(result.teamSlug);
        setState("success");
        setMessage("Invite accepted. You can now access this team.");
      } catch (error: any) {
        if (!mounted) return;

        setState("error");
        setMessage(error?.message || "Unable to accept invite. It may be expired.");
      }
    };

    accept();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-svh bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-8 space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Team Invitation</h1>
        <p className="text-sm text-neutral-300">{message}</p>

        {state === "loading" && (
          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full w-1/3 bg-white animate-pulse" />
          </div>
        )}

        {state === "success" && teamSlug && (
          <Link
            href={`/dashboard/${teamSlug}`}
            className="inline-flex items-center justify-center rounded-md bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition-colors"
          >
            Open Team Dashboard
          </Link>
        )}

        {state === "error" && (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-neutral-700 text-neutral-100 text-sm font-medium px-4 py-2 hover:bg-neutral-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
