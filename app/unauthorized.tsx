import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
        401
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Sign in to continue
      </h1>
      <p className="text-muted-foreground max-w-md text-sm">
        This page requires an account. Sign in and you&apos;ll be taken right
        back to where you were headed.
      </p>
      <Link
        href="/auth/login"
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
      >
        Sign in
      </Link>
    </main>
  );
}
