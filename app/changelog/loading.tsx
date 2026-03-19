import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-svh w-full bg-black">
      <main className="container mx-auto max-w-3xl px-4 md:px-6 pt-16 pb-24 space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-16 w-72 bg-white/10" />
          <Skeleton className="h-4 w-80 max-w-full bg-white/10" />
        </div>

        <div className="space-y-10 border-l border-white/10 pl-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-8 w-2/3 bg-white/10" />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
