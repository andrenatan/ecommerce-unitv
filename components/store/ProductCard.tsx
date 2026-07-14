"use client";

import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Produto } from "@/types";

export function ProductCard({ produto }: { produto: Produto }) {
  const addItem = useCart((state) => state.addItem);

  function handleAdd() {
    addItem(produto);
    toast.success(`${produto.nome} adicionado ao carrinho`);
  }

  return (
    <Card className="group overflow-hidden ring-1 ring-border/60 transition-colors hover:ring-primary/50">
      <Link href={`/produtos/${produto.slug}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-card to-secondary/10">
          {produto.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-2xl font-semibold text-primary/60">
              {produto.nome.slice(0, 2).toUpperCase()}
            </div>
          )}
          <Badge className="absolute left-2 top-2 gap-1 bg-success text-white">
            <ZapIcon className="size-3" />
            Entrega Imediata
          </Badge>
        </div>
      </Link>

      <CardContent className="flex flex-col gap-1">
        <Link href={`/produtos/${produto.slug}`}>
          <h3 className="font-heading font-medium leading-tight hover:text-primary">
            {produto.nome}
          </h3>
        </Link>
        {produto.descricao && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {produto.descricao}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between !border-t-0 !bg-transparent">
        <span className="font-heading text-lg font-semibold text-secondary">
          R$ {produto.preco.toFixed(2)}
        </span>
        <Button size="sm" onClick={handleAdd}>
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
