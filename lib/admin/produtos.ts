import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { codigos, produtos } from "@/db/schema";

export async function getProdutosAdmin() {
  const rows = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      preco: produtos.preco,
      appTipo: produtos.appTipo,
      ativo: produtos.ativo,
      imagemUrl: produtos.imagemUrl,
      abacateProductId: produtos.abacateProductId,
      estoque: count(codigos.id),
    })
    .from(produtos)
    .leftJoin(
      codigos,
      and(eq(codigos.produtoId, produtos.id), eq(codigos.vendido, false))
    )
    .groupBy(produtos.id)
    .orderBy(produtos.createdAt);

  return rows;
}

export async function getProdutoByIdAdmin(id: string) {
  return db.query.produtos.findFirst({ where: eq(produtos.id, id) });
}
