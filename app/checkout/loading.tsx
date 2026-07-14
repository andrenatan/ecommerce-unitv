import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}
