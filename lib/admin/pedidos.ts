import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";

export async function getPedidosAdmin(status?: string) {
  return db.query.pedidos.findMany({
    where: status ? eq(pedidos.status, status) : undefined,
    orderBy: [desc(pedidos.createdAt)],
    with: {
      profile: { columns: { nome: true, email: true } },
      itens: { with: { produto: { columns: { nome: true } } } },
      codigos: { columns: { codigo: true, produtoId: true } },
    },
  });
}
