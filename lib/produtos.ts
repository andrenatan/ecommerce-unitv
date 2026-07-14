import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { produtos, codigos } from '@/db/schema';
import type { Produto } from '@/types';

/** Produtos ativos com pelo menos 1 código disponível (não vendido). */
export async function getProdutosDisponiveis(): Promise<Produto[]> {
  const rows = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      descricao: produtos.descricao,
      imagemUrl: produtos.imagemUrl,
      preco: produtos.preco,
      appTipo: produtos.appTipo,
      estoque: count(codigos.id),
    })
    .from(produtos)
    .leftJoin(
      codigos,
      and(eq(codigos.produtoId, produtos.id), eq(codigos.vendido, false))
    )
    .where(eq(produtos.ativo, true))
    .groupBy(produtos.id)
    .having(sql`count(${codigos.id}) > 0`)
    .orderBy(produtos.createdAt);

  return rows.map((row) => ({ ...row, preco: parseFloat(row.preco) }));
}

/** Produto ativo com estoque disponível pelo slug, ou null se não existir/sem estoque. */
export async function getProdutoDisponivelBySlug(
  slug: string
): Promise<Produto | null> {
  const rows = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      descricao: produtos.descricao,
      imagemUrl: produtos.imagemUrl,
      preco: produtos.preco,
      appTipo: produtos.appTipo,
      estoque: count(codigos.id),
    })
    .from(produtos)
    .leftJoin(
      codigos,
      and(eq(codigos.produtoId, produtos.id), eq(codigos.vendido, false))
    )
    .where(and(eq(produtos.slug, slug), eq(produtos.ativo, true)))
    .groupBy(produtos.id)
    .having(sql`count(${codigos.id}) > 0`)
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { ...row, preco: parseFloat(row.preco) };
}
