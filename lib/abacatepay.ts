import { createHash } from 'crypto';

const ABACATE_BASE_URL = 'https://api.abacatepay.com/v2';

type AbacateResponse<T> = { data: T; success: boolean; error: string | null };

async function abacateFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<AbacateResponse<T>> {
  const res = await fetch(`${ABACATE_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`AbacatePay ${res.status}: ${err?.error ?? res.statusText}`);
  }

  return res.json();
}

export { abacateFetch };

/**
 * Converte um telefone salvo no formato DDI+DDD+número (ex: "5531995541401")
 * para o formato aceito pelo AbacatePay: apenas DDD+número, sem DDI e sem
 * formatação (ex: "31995541401").
 */
export function toAbacateCellphone(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
}

export type AbacateProduct = {
  id: string;
  externalId: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type AbacateProductInput = {
  id: string; // UUID do produto no Supabase — usado como externalId
  nome: string;
  preco: string; // valor decimal (ex: "24.90")
  descricao?: string | null;
  imagemUrl?: string | null;
};

/**
 * Garante que o produto no AbacatePay reflete o preço/nome/descrição atuais.
 *
 * O AbacatePay não tem endpoint de update, e /products/delete falha (400)
 * quando o produto já tem checkouts/pedidos vinculados — então NUNCA apagamos
 * um produto existente. Em vez disso, o externalId é derivado de um hash dos
 * campos relevantes: se algo muda, vira um externalId novo (produto novo no
 * AbacatePay); se nada mudou, o mesmo externalId já existe e é reaproveitado.
 * Produtos antigos ficam órfãos no AbacatePay — inofensivo, sem custo.
 */
export async function syncAbacateProduct(produto: AbacateProductInput): Promise<AbacateProduct> {
  const priceCents = Math.round(parseFloat(produto.preco) * 100);
  const variantHash = createHash('sha256')
    .update(`${produto.nome}|${priceCents}|${produto.descricao ?? ''}|${produto.imagemUrl ?? ''}`)
    .digest('hex')
    .slice(0, 12);
  const externalId = `${produto.id}-${variantHash}`;

  const getRes = await fetch(
    `${ABACATE_BASE_URL}/products/get?externalId=${externalId}`,
    {
      headers: { Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}` },
    }
  );

  if (getRes.ok) {
    const { data: existente } = (await getRes.json()) as AbacateResponse<AbacateProduct>;
    return existente;
  }

  const { data: novo } = await abacateFetch<AbacateProduct>('/products/create', {
    method: 'POST',
    body: JSON.stringify({
      externalId,
      name: produto.nome,
      price: priceCents,
      currency: 'BRL',
      description: produto.descricao ?? undefined,
      imageUrl: produto.imagemUrl ?? undefined,
    }),
  });

  return novo;
}

export type AbacateCustomer = {
  id: string;
};

export type AbacateCheckout = {
  id: string;
  url: string;
  amount: number;
  status: string;
  externalId: string;
};
