import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-svh w-full bg-black">
      <main className="container mx-auto max-w-4xl px-4 pt-8 pb-20 space-y-8">
        <Skeleton className="h-4 w-24 bg-white/10" />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 bg-white/10 rounded-full" />
            <Skeleton className="h-5 w-24 bg-white/10 rounded-full" />
          </div>
          <Skeleton className="h-12 w-3/4 bg-white/10" />
          <div className="flex gap-4 flex-wrap">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10 space-y-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full bg-white/10" />
          ))}
        </section>
      </main>
    </div>
  );
}
