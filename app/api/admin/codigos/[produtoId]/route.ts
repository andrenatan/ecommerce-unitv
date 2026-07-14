import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { codigos, produtos } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ produtoId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { produtoId } = await params;

  const produto = await db.query.produtos.findFirst({
    where: eq(produtos.id, produtoId),
  });
  if (!produto) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const linhas: string[] = body?.codigos ?? [];

  const codigosLimpos = linhas
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  if (codigosLimpos.length === 0) {
    return NextResponse.json({ error: "Nenhum código válido informado" }, { status: 400 });
  }

  await db.insert(codigos).values(
    codigosLimpos.map((codigo) => ({
      produtoId,
      codigo,
      vendido: false,
    }))
  );

  return NextResponse.json({ importados: codigosLimpos.length });
}
