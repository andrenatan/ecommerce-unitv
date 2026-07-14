import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { produtos } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/guard";
import { syncAbacateProduct } from "@/lib/abacatepay";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { nome, slug, descricao, preco, appTipo, ativo, imagemUrl } = body ?? {};

  if (!nome || !slug || typeof preco !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [produto] = await db
    .insert(produtos)
    .values({
      nome,
      slug,
      descricao: descricao || null,
      preco: preco.toFixed(2),
      appTipo: appTipo || null,
      ativo: ativo ?? true,
      imagemUrl: imagemUrl || null,
    })
    .returning();

  // Sincronizar imediatamente com o AbacatePay
  try {
    const abacateProduct = await syncAbacateProduct({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      descricao: produto.descricao,
      imagemUrl: produto.imagemUrl,
    });

    await db
      .update(produtos)
      .set({ abacateProductId: abacateProduct.id })
      .where(eq(produtos.id, produto.id));

    produto.abacateProductId = abacateProduct.id;
  } catch (error) {
    console.error("[Admin] Erro ao sincronizar produto com AbacatePay:", error);
  }

  return NextResponse.json({ produto });
}
