"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangleIcon className="size-12 text-destructive" />
      <h1 className="font-heading text-2xl font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou volte
        para a loja.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RotateCcwIcon className="mr-1 size-4" />
          Tentar de novo
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}
