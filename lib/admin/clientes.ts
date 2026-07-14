import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";

export type ClienteAdmin = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string;
  primeiraCompra: Date | null;
  ultimaCompra: Date | null;
  produtoAdquirido: string | null;
  totalPedidos: number;
};

export async function getClientesAdmin(): Promise<ClienteAdmin[]> {
  const perfis = await db.query.profiles.findMany({
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: {
      pedidos: {
        where: eq(pedidos.status, "aprovado"),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
        with: {
          itens: { with: { produto: { columns: { nome: true } } } },
        },
      },
    },
  });

  return perfis.map((perfil) => {
    const aprovados = perfil.pedidos;
    const maisRecente = aprovados[0];
    const maisAntigo = aprovados[aprovados.length - 1];

    return {
      id: perfil.id,
      nome: perfil.nome,
      telefone: perfil.telefone,
      email: perfil.email,
      primeiraCompra: maisAntigo?.createdAt ?? null,
      ultimaCompra: maisRecente?.createdAt ?? null,
      produtoAdquirido: maisRecente?.itens[0]?.produto.nome ?? null,
      totalPedidos: aprovados.length,
    };
  });
}
