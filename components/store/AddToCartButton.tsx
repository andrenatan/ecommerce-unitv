"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import type { Produto } from "@/types";

export function AddToCartButton({ produto }: { produto: Produto }) {
  const [quantidade, setQuantidade] = useState(1);
  const addItem = useCart((state) => state.addItem);

  function handleAdd() {
    addItem(produto, quantidade);
    toast.success(`${produto.nome} adicionado ao carrinho`);
    setQuantidade(1);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
        >
          <MinusIcon />
        </Button>
        <span className="w-6 text-center">{quantidade}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setQuantidade((q) => Math.min(produto.estoque, q + 1))}
        >
          <PlusIcon />
        </Button>
      </div>
      <Button size="lg" className="flex-1" onClick={handleAdd}>
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
