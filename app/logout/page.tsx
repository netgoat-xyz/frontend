"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function signOut() {
      try {
        await authClient.signOut();
      } finally {
        if (active) {
          router.replace("/");
          router.refresh();
        }
      }
    }

    void signOut();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-5" />
        <p className="text-muted-foreground text-sm">Signing you out…</p>
      </div>
    </main>
  );
}
