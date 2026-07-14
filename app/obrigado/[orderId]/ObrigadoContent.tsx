"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { usePedidoStatus } from "@/hooks/usePedidoStatus";
import { useCart } from "@/hooks/useCart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyCodeButton } from "@/components/store/CopyCodeButton";

type ItemComProduto = {
  quantidade: number;
  produto: { id: string; nome: string };
};

type CodigoEntregue = {
  codigo: string;
  produtoId: string;
};

export function ObrigadoContent({
  pedidoId,
  statusInicial,
  itens,
  codigos,
}: {
  pedidoId: string;
  statusInicial: string;
  itens: ItemComProduto[];
  codigos: CodigoEntregue[];
}) {
  const router = useRouter();
  const status = usePedidoStatus(pedidoId, statusInicial);
  const clearCart = useCart((state) => state.clear);
  const cartCleared = useRef(false);

  // Se o status mudou (via polling) mas ainda não temos os códigos nesta renderização,
  // força um refetch do Server Component para pegar os códigos entregues pelo webhook.
  useEffect(() => {
    if (status === "aprovado" && codigos.length === 0) {
      router.refresh();
    }
  }, [status, codigos.length, router]);

  useEffect(() => {
    if (status === "aprovado" && !cartCleared.current) {
      cartCleared.current = true;
      clearCart();
    }
  }, [status, clearCart]);

  if (status === "expirado") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <XCircleIcon className="size-12 text-destructive" />
        <h1 className="font-heading text-2xl font-semibold">Pagamento expirado</h1>
        <p className="text-muted-foreground">
          O prazo para pagamento deste pedido expirou. Volte à loja e faça um novo pedido.
        </p>
      </main>
    );
  }

  if (status !== "aprovado") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <Loader2Icon className="size-12 animate-spin text-primary" />
        <h1 className="font-heading text-2xl font-semibold">
          Aguardando confirmação do pagamento
        </h1>
        <p className="text-muted-foreground">
          Assim que recebermos a confirmação, seus códigos aparecerão aqui automaticamente.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2Icon className="size-12 text-success" />
        <h1 className="font-heading text-2xl font-semibold">Pedido confirmado!</h1>
        <p className="text-muted-foreground">
          Seus códigos de ativação estão prontos. Guarde-os com cuidado.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {itens.map((item) => {
          const codigosDoItem = codigos.filter((c) => c.produtoId === item.produto.id);
          return (
            <Card key={item.produto.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.produto.nome}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {codigosDoItem.map((c) => (
                  <div
                    key={c.codigo}
                    className="flex items-center justify-between gap-3 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3"
                  >
                    <span className="font-mono text-lg font-semibold tracking-wider text-secondary">
                      {c.codigo}
                    </span>
                    <CopyCodeButton codigo={c.codigo} />
                  </div>
                ))}
                {codigosDoItem.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Carregando código{item.quantidade > 1 ? "s" : ""}...
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como ativar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>1. Abra o aplicativo no seu dispositivo.</p>
          <p>2. Acesse o menu de Configurações {'>'} Ativação.</p>
          <p>3. Insira o código exibido acima e confirme.</p>
          <p>Em caso de dúvidas, entre em contato com o nosso suporte.</p>
        </CardContent>
      </Card>
    </main>
  );
}
