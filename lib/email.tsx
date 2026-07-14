import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { resend } from "@/lib/resend";
import { PurchaseConfirmation } from "@/emails/PurchaseConfirmation";

export async function enviarEmailConfirmacao(pedidoId: string): Promise<boolean> {
  const pedido = await db.query.pedidos.findFirst({
    where: eq(pedidos.id, pedidoId),
    with: {
      itens: { with: { produto: true } },
      codigos: { columns: { codigo: true, produtoId: true } },
      profile: { columns: { nome: true, email: true } },
    },
  });

  if (!pedido || !pedido.profile) {
    console.error(`[Email] Pedido ${pedidoId} não encontrado ou sem perfil associado`);
    return false;
  }

  const itensEmail = pedido.itens.map((item) => ({
    nome: item.produto.nome,
    quantidade: item.quantidade,
    precoUnit: parseFloat(item.precoUnit),
    codigos: pedido.codigos
      .filter((codigo) => codigo.produtoId === item.produtoId)
      .map((codigo) => codigo.codigo),
  }));

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: pedido.profile.email,
    subject: "Seu código de ativação chegou! 🎉",
    react: (
      <PurchaseConfirmation
        nomeCliente={pedido.profile.nome}
        itens={itensEmail}
        total={parseFloat(pedido.total)}
        obrigadoUrl={`${process.env.NEXT_PUBLIC_URL}/obrigado/${pedido.id}`}
      />
    ),
  });

  if (error) {
    console.error("[Email] Erro ao enviar confirmação:", error);
    return false;
  }

  await db
    .update(pedidos)
    .set({ emailEnviado: true })
    .where(eq(pedidos.id, pedidoId));

  return true;
}
