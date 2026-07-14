import { Skeleton } from "@/components/ui/skeleton";

export default function ProdutoLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </main>
  );
}
