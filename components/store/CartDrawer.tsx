"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCart, useCartTotal } from "@/hooks/useCart";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const isOpen = useCart((state) => state.isOpen);
  const close = useCart((state) => state.close);
  const open = useCart((state) => state.open);
  const items = useCart((state) => state.items);
  const updateQuantidade = useCart((state) => state.updateQuantidade);
  const removeItem = useCart((state) => state.removeItem);
  const total = useCartTotal();

  return (
    <Sheet open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.produtoId} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagemUrl}
                        alt={item.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-medium leading-tight">{item.nome}</p>
                    <p className="text-sm text-secondary">
                      R$ {item.preco.toFixed(2)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantidade(item.produtoId, item.quantidade - 1)
                        }
                      >
                        <MinusIcon />
                      </Button>
                      <span className="w-4 text-center text-sm">
                        {item.quantidade}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantidade(item.produtoId, item.quantidade + 1)
                        }
                      >
                        <PlusIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-auto text-destructive"
                        onClick={() => removeItem(item.produtoId)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t">
            <div className="flex items-center justify-between text-base font-medium">
              <span>Total</span>
              <span className="text-secondary">R$ {total.toFixed(2)}</span>
            </div>
            <SheetClose
              render={
                <Link href="/checkout" className={buttonVariants({ className: "w-full" })}>
                  Finalizar compra
                </Link>
              }
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
