import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ObrigadoContent } from "./ObrigadoContent";

export const metadata: Metadata = {
  title: "Pedido confirmado | UniTV Codes",
  robots: { index: false, follow: false },
};

export default async function ObrigadoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/conta/login?redirectTo=/obrigado/${orderId}`);
  }

  const pedido = await db.query.pedidos.findFirst({
    where: eq(pedidos.id, orderId),
    with: {
      itens: { with: { produto: true } },
      codigos: { columns: { codigo: true, produtoId: true } },
    },
  });

  if (!pedido || pedido.userId !== user.id) {
    notFound();
  }

  return (
    <ObrigadoContent
      pedidoId={pedido.id}
      statusInicial={pedido.status ?? "pendente"}
      itens={pedido.itens.map((item) => ({
        quantidade: item.quantidade,
        produto: { id: item.produto.id, nome: item.produto.nome },
      }))}
      codigos={pedido.codigos}
    />
  );
}
