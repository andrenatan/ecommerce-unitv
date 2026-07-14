import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-border/60 px-4 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-10 w-3/4 max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
