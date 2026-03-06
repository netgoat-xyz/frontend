"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function YeetMe() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
        },
      });
    };

    performSignOut();
  }, [router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <h1 className="text-2xl font-bold">Logging you out...</h1>
    </div>
  );
}