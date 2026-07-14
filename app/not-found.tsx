import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <CompassIcon className="size-12 text-primary" />
      <h1 className="font-heading text-3xl font-semibold">
        404 — Página não encontrada
      </h1>
      <p className="max-w-md text-muted-foreground">
        O produto ou a página que você procura não existe ou não está mais
        disponível.
      </p>
      <Link href="/" className={buttonVariants()}>
        Voltar para a loja
      </Link>
    </main>
  );
}
