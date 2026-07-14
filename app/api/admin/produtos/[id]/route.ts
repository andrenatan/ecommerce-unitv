import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { produtos } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/guard";
import { abacateFetch, type AbacateProduct } from "@/lib/abacatepay";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const produtoAtual = await db.query.produtos.findFirst({
    where: eq(produtos.id, id),
  });

  if (!produtoAtual) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { nome, slug, descricao, preco, appTipo, ativo, imagemUrl } = body ?? {};

  const updateData: Partial<typeof produtos.$inferInsert> = {};
  if (nome !== undefined) updateData.nome = nome;
  if (slug !== undefined) updateData.slug = slug;
  if (descricao !== undefined) updateData.descricao = descricao || null;
  if (typeof preco === "number") updateData.preco = preco.toFixed(2);
  if (appTipo !== undefined) updateData.appTipo = appTipo || null;
  if (ativo !== undefined) updateData.ativo = ativo;
  if (imagemUrl !== undefined) updateData.imagemUrl = imagemUrl || null;

  const [produto] = await db
    .update(produtos)
    .set(updateData)
    .where(eq(produtos.id, id))
    .returning();

  // Ao editar, sincronizar de novo com o AbacatePay (nome/preço/imagem podem ter mudado)
  try {
    const { data: abacateProduct } = await abacateFetch<AbacateProduct>(
      "/products/create",
      {
        method: "POST",
        body: JSON.stringify({
          externalId: produto.id,
          name: produto.nome,
          price: Math.round(parseFloat(produto.preco) * 100),
          currency: "BRL",
          description: produto.descricao ?? undefined,
          imageUrl: produto.imagemUrl ?? undefined,
        }),
      }
    );

    await db
      .update(produtos)
      .set({ abacateProductId: abacateProduct.id })
      .where(eq(produtos.id, id));

    produto.abacateProductId = abacateProduct.id;
  } catch (error) {
    console.error("[Admin] Erro ao sincronizar produto com AbacatePay:", error);
  }

  return NextResponse.json({ produto });
}
