"use client";

import { AuthForm } from "@/components/auth-form";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="fixed z-50 top-4 left-4 right-4 border-2 border-yellow-500 bg-yellow-500/20 py-4 px-6 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white font-semibold text-center  flex-1">
            This is a demo — nothing will work yet! We&apos;re still working on it. <br />
            <span className="text-sm">fund our development at <a href="https://opencollective.com/netgoat" className="text-blue-300 hover:text-blue-400 transition-all">OpenCollective!</a></span>
          </p>
        </div>

        <AuthForm onSuccess={() => router.push("/dashboard")} />
      </div>
    </div>
  );
}
