import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { codigos, produtos } from "@/db/schema";

export async function getCodigosDoProdutoAdmin(produtoId: string) {
  const produto = await db.query.produtos.findFirst({
    where: eq(produtos.id, produtoId),
  });

  if (!produto) return null;

  const listaCodigos = await db.query.codigos.findMany({
    where: eq(codigos.produtoId, produtoId),
    orderBy: [desc(codigos.createdAt)],
    with: {
      pedido: {
        with: {
          profile: { columns: { nome: true, email: true } },
        },
      },
    },
  });

  return { produto, codigos: listaCodigos };
}
