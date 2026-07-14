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
};

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
