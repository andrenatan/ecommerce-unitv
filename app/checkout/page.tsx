"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart, useCartTotal } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const hasHydrated = useCart((state) => state.hasHydrated);
  const total = useCartTotal();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasHydrated && items.length === 0) {
      router.replace("/");
    }
  }, [hasHydrated, items.length, router]);

  async function handleFinalizar() {
    setLoading(true);

    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Não foi possível iniciar o pagamento", {
          description: data.error ?? "Tente novamente em instantes.",
        });
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Erro de conexão", {
        description: "Verifique sua internet e tente novamente.",
      });
      setLoading(false);
    }
  }

  if (!hasHydrated || items.length === 0) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Checkout</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do pedido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.produtoId} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium leading-tight">{item.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantidade} × R$ {item.preco.toFixed(2)}
                </p>
              </div>
              <span className="font-medium">
                R$ {(item.preco * item.quantidade).toFixed(2)}
              </span>
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-secondary">R$ {total.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={handleFinalizar} disabled={loading}>
            {loading ? "Redirecionando..." : "Ir para pagamento (PIX / Cartão)"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Você será redirecionado para uma página segura do AbacatePay para concluir o pagamento.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
