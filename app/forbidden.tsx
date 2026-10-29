import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
        403
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        You don&apos;t have access to this page
      </h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Your account is signed in, but it is missing the permissions required
        for this area. If you believe this is a mistake, contact your team
        owner or an administrator.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
