import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { produtos, codigos, pedidos, itensPedido, profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  abacateFetch,
  syncAbacateProduct,
  toAbacateCellphone,
  type AbacateCustomer,
  type AbacateCheckout,
} from "@/lib/abacatepay";

type CartItemInput = { produtoId: string; quantidade: number };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cartItems: CartItemInput[] | undefined = body?.cartItems;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  const produtoIds = cartItems.map((item) => item.produtoId);

  const produtosRows = await db
    .select()
    .from(produtos)
    .where(inArray(produtos.id, produtoIds));

  const produtoMap = new Map(produtosRows.map((p) => [p.id, p]));

  // 1. Verificar estoque antes de tudo
  for (const item of cartItems) {
    const produto = produtoMap.get(item.produtoId);
    if (!produto || !produto.ativo) {
      return NextResponse.json({ error: "Produto indisponível" }, { status: 400 });
    }

    const [{ disponivel }] = await db
      .select({ disponivel: count() })
      .from(codigos)
      .where(and(eq(codigos.produtoId, item.produtoId), eq(codigos.vendido, false)));

    if (disponivel < item.quantidade) {
      return NextResponse.json(
        { error: `Estoque insuficiente para ${produto.nome}` },
        { status: 400 }
      );
    }
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 400 });
  }

  try {
    // 2. Sincronizar produtos com o AbacatePay sempre, para garantir que o preço
    // enviado reflita o valor atual do produto (o AbacatePay não expõe um
    // endpoint de update — syncAbacateProduct apaga e recria quando algo mudou,
    // evitando cobrar um preço antigo cacheado em um abacate_product_id velho).
    for (const item of cartItems) {
      const produto = produtoMap.get(item.produtoId)!;
      const abacateProduct = await syncAbacateProduct({
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        descricao: produto.descricao,
        imagemUrl: produto.imagemUrl,
      });

      if (abacateProduct.id !== produto.abacateProductId) {
        await db
          .update(produtos)
          .set({ abacateProductId: abacateProduct.id })
          .where(eq(produtos.id, produto.id));
      }

      produto.abacateProductId = abacateProduct.id;
    }

    // 3. Criar/recuperar customer no AbacatePay
    const { data: customer } = await abacateFetch<AbacateCustomer>(
      "/customers/create",
      {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          name: profile.nome,
          cellphone: profile.telefone ? toAbacateCellphone(profile.telefone) : undefined,
        }),
      }
    );

    const pedidoId = randomUUID();

    // 4. Criar Checkout no AbacatePay
    const { data: billing } = await abacateFetch<AbacateCheckout>(
      "/checkouts/create",
      {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: produtoMap.get(item.produtoId)!.abacateProductId,
            quantity: item.quantidade,
          })),
          customerId: customer.id,
          externalId: pedidoId,
          methods: ["PIX", "CARD"],
          card: { maxInstallments: 1 },
          completionUrl: `${process.env.NEXT_PUBLIC_URL}/obrigado/${pedidoId}`,
          returnUrl: `${process.env.NEXT_PUBLIC_URL}/checkout`,
          metadata: { source: "loja-iptv" },
        }),
      }
    );

    const total = cartItems.reduce((sum, item) => {
      const produto = produtoMap.get(item.produtoId)!;
      return sum + parseFloat(produto.preco) * item.quantidade;
    }, 0);

    // 5. Salvar pedido + itens (já com bill_id/checkout_url, sem estado intermediário órfão)
    await db.transaction(async (tx) => {
      await tx.insert(pedidos).values({
        id: pedidoId,
        userId: user.id,
        status: "pendente",
        total: total.toFixed(2),
        abacateBillId: billing.id,
        abacateCheckoutUrl: billing.url,
      });

      await tx.insert(itensPedido).values(
        cartItems.map((item) => ({
          pedidoId,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnit: produtoMap.get(item.produtoId)!.preco,
        }))
      );
    });

    return NextResponse.json({ checkoutUrl: billing.url });
  } catch (error) {
    console.error("[Pagamento] Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
