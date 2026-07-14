import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { codigos, pedidos, produtos } from "@/db/schema";

const LIMITE_ESTOQUE_BAIXO = 5;

export async function getDashboardStats() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ totalDia }] = await db
    .select({
      totalDia: sql<string>`COALESCE(SUM(CAST(${pedidos.total} AS numeric)), 0)`,
    })
    .from(pedidos)
    .where(and(eq(pedidos.status, "aprovado"), gte(pedidos.createdAt, hoje)));

  const [{ totalMes }] = await db
    .select({
      totalMes: sql<string>`COALESCE(SUM(CAST(${pedidos.total} AS numeric)), 0)`,
    })
    .from(pedidos)
    .where(and(eq(pedidos.status, "aprovado"), gte(pedidos.createdAt, inicioMes)));

  const [{ totalAprovados, somaAprovados }] = await db
    .select({
      totalAprovados: count(),
      somaAprovados: sql<string>`COALESCE(SUM(CAST(${pedidos.total} AS numeric)), 0)`,
    })
    .from(pedidos)
    .where(eq(pedidos.status, "aprovado"));

  const ticketMedio =
    totalAprovados > 0 ? parseFloat(somaAprovados) / totalAprovados : 0;

  const ultimosPedidos = await db.query.pedidos.findMany({
    orderBy: [desc(pedidos.createdAt)],
    limit: 5,
    with: {
      profile: { columns: { nome: true, email: true } },
    },
  });

  const estoqueBaixo = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      estoque: count(codigos.id),
    })
    .from(produtos)
    .leftJoin(
      codigos,
      and(eq(codigos.produtoId, produtos.id), eq(codigos.vendido, false))
    )
    .where(eq(produtos.ativo, true))
    .groupBy(produtos.id)
    .having(sql`count(${codigos.id}) < ${LIMITE_ESTOQUE_BAIXO}`);

  return {
    vendasHoje: parseFloat(totalDia),
    vendasMes: parseFloat(totalMes),
    totalPedidos: totalAprovados,
    ticketMedio,
    ultimosPedidos,
    estoqueBaixo,
  };
}
