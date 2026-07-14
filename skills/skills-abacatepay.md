# SKILL: AbacatePay — Referência de Integração

Consulte este arquivo **antes de qualquer código de pagamento**.  
Base URL: `https://api.abacatepay.com/v2`  
Auth: `Authorization: Bearer <ABACATEPAY_API_KEY>` em todas as requisições.  
Valores monetários: **sempre em centavos** (R$ 29,90 → `2990`).  
Envelope de resposta padrão: `{ "data": {...}, "success": true, "error": null }`.

---

## 1. Helper base (lib/abacatepay.ts)

```typescript
// lib/abacatepay.ts
const ABACATE_BASE_URL = 'https://api.abacatepay.com/v2';

async function abacateFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; success: boolean; error: string | null }> {
  const res = await fetch(`${ABACATE_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
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
```

---

## 2. Produtos (`/products`)

Produtos **devem existir no AbacatePay** antes de criar um Checkout.  
Ao criar um produto no painel admin, sincronize imediatamente e salve o `id` retornado em `produtos.abacate_product_id`.

```typescript
// Criar produto no AbacatePay
const { data: abacateProduct } = await abacateFetch('/products/create', {
  method: 'POST',
  body: JSON.stringify({
    externalId: produto.id,                    // UUID do Supabase
    name: produto.nome,
    price: Math.round(produto.preco * 100),    // centavos
    currency: 'BRL',
    description: produto.descricao ?? undefined,
    imageUrl: produto.imagem_url ?? undefined,
    // NÃO incluir 'cycle' → produto avulso (one-time payment)
  }),
});
// Salvar: UPDATE produtos SET abacate_product_id = abacateProduct.id WHERE id = produto.id
```

**Resposta:**
```json
{
  "data": {
    "id": "prod_abc123xyz",
    "externalId": "uuid-do-supabase",
    "name": "UniTV 30 dias",
    "price": 2990,
    "currency": "BRL",
    "status": "ACTIVE"
  }
}
```

---

## 3. Clientes (`/customers`)

Clientes são **únicos por email** — se já existir, retorna o existente automaticamente.  
Criar antes de qualquer checkout para pré-preencher os dados do cliente.

**⚠️ `cellphone` não aceita DDI nem formatação** — a AbacatePay repassa o valor como veio, sem normalizar. Se `user.telefone` estiver salvo como `5531999999999` (DDI+DDD+número, padrão deste projeto), remova o `55` antes de enviar. Use `toAbacateCellphone()` de `lib/abacatepay.ts`.

```typescript
// Criar ou recuperar cliente
import { toAbacateCellphone } from '@/lib/abacatepay';

const { data: customer } = await abacateFetch('/customers/create', {
  method: 'POST',
  body: JSON.stringify({
    email: user.email,
    name: user.nome,
    cellphone: toAbacateCellphone(user.telefone), // "31999999999" — sem DDI, só DDD+número
    // taxId: cpf (opcional, mas recomendado)
  }),
});
// customer.id = "cust_abc123xyz"
```

---

## 4. Checkouts (`/checkouts`) — Fluxo principal

```typescript
// POST /api/pagamento/criar (route handler Next.js)
import { abacateFetch } from '@/lib/abacatepay';

export async function POST(request: Request) {
  const { cartItems, user, pedidoId } = await request.json();

  // 1. Criar/recuperar customer no AbacatePay
  const { data: customer } = await abacateFetch('/customers/create', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, name: user.nome, cellphone: user.telefone }),
  });

  // 2. Criar Checkout
  const { data: billing } = await abacateFetch('/checkouts/create', {
    method: 'POST',
    body: JSON.stringify({
      items: cartItems.map((item: any) => ({
        id: item.abacate_product_id,   // prod_... (obrigatório — não o UUID do Supabase)
        quantity: item.quantidade,
      })),
      customerId: customer.id,          // cust_...
      externalId: pedidoId,             // UUID do pedido no Supabase (para identificar no webhook)
      methods: ['PIX', 'CARD'],
      card: { maxInstallments: 1 },     // sem parcelamento para gift cards
      completionUrl: `${process.env.NEXT_PUBLIC_URL}/obrigado/${pedidoId}`,
      returnUrl: `${process.env.NEXT_PUBLIC_URL}/checkout`,
      metadata: { source: 'loja-iptv' },
    }),
  });

  // 3. Salvar billing.id e billing.url no pedido (Supabase)
  // UPDATE pedidos SET abacate_bill_id = billing.id, abacate_checkout_url = billing.url WHERE id = pedidoId

  return Response.json({ checkoutUrl: billing.url });
}
```

**Resposta do checkout:**
```json
{
  "data": {
    "id": "bill_abc123xyz",
    "url": "https://app.abacatepay.com/pay/bill_abc123xyz",
    "amount": 2990,
    "status": "PENDING",
    "externalId": "uuid-do-pedido",
    "completionUrl": "https://seusite.com/obrigado/uuid-do-pedido"
  }
}
```

**No frontend:** redirecionar para `billing.url` — o cliente finaliza o pagamento na página hospedada AbacatePay.

```typescript
// app/(store)/checkout/page.tsx
const res = await fetch('/api/pagamento/criar', { method: 'POST', body: JSON.stringify(payload) });
const { checkoutUrl } = await res.json();
window.location.href = checkoutUrl; // redirect para AbacatePay
```

---

## 5. Webhook (`checkout.completed`) — Entrega de Códigos

**CRÍTICO:** usar a chave pública oficial do AbacatePay para validar HMAC.  
Header de assinatura: `X-Webhook-Signature`  
Algoritmo: HMAC-SHA256 com digest em **base64**.

```typescript
// app/api/pagamento/webhook/route.ts
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Chave pública oficial do AbacatePay para validação HMAC
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';

function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
  const bodyBuffer = Buffer.from(rawBody, 'utf8');
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest('base64');

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  // timingSafeEqual previne timing attacks
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') ?? '';

  // 1. Validar assinatura
  if (!verifyAbacateSignature(rawBody, signature)) {
    console.warn('[Webhook] Assinatura inválida — requisição rejeitada');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // 2. Salvar log do webhook (para auditoria)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await supabase.from('webhook_logs').insert({
    evento: payload.event,
    payload: payload,
    recebido_em: new Date().toISOString(),
  });

  // 3. Processar evento
  if (payload.event === 'checkout.completed' && payload.data?.checkout?.status === 'PAID') {
    const pedidoId = payload.data.checkout.externalId;

    // 4. Idempotência — checar se já processado
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, status')
      .eq('id', pedidoId)
      .single();

    if (!pedido || pedido.status === 'aprovado') {
      return Response.json({ ok: true, msg: 'Já processado' });
    }

    // 5. Entrega atômica dos códigos (função PostgreSQL para garantir atomicidade)
    const { error } = await supabase.rpc('entregar_codigos_pedido', { p_pedido_id: pedidoId });

    if (error) {
      console.error('[Webhook] Erro ao entregar códigos:', error);
      return Response.json({ error: 'Erro interno' }, { status: 500 });
    }

    // 6. Enviar e-mail (importar função de envio de email)
    // await enviarEmailConfirmacao(pedidoId);
  }

  // ⚠️ checkout.expired NÃO existe no AbacatePay v2 — não há webhook de expiração.
  // Pedidos expirados ficam com status EXPIRED no AbacatePay sem notificação.
  // Para detectar expiração: verificar via GET /checkouts/one periodicamente (cron job).

  if (payload.event === 'checkout.refunded') {
    const pedidoId = payload.data?.checkout?.externalId;
    if (pedidoId) {
      await supabase.from('pedidos').update({ status: 'reembolsado' }).eq('id', pedidoId);
    }
  }

  if (payload.event === 'checkout.disputed') {
    const pedidoId = payload.data?.checkout?.externalId;
    if (pedidoId) {
      await supabase.from('pedidos').update({ status: 'em_disputa' }).eq('id', pedidoId);
    }
  }

  // Sempre responder 200 — AbacatePay reenvia em caso de falha
  return Response.json({ ok: true });
}
```

**Também adicionar o secret na query string da URL de webhook:**
```
https://seusite.com.br/api/pagamento/webhook?webhookSecret=SEU_SECRET_AQUI
```

```typescript
// Validar o secret da query string também:
const url = new URL(request.url);
const webhookSecret = url.searchParams.get('webhookSecret');
if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 6. Função SQL para Entrega Atômica de Códigos

```sql
-- Criar esta função no Supabase (SQL Editor)
-- Garante que nenhum código é entregue duas vezes, mesmo com chamadas simultâneas

CREATE OR REPLACE FUNCTION entregar_codigos_pedido(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_codigo_id UUID;
BEGIN
  -- Lock no pedido para evitar processamento duplicado
  PERFORM id FROM pedidos WHERE id = p_pedido_id FOR UPDATE;

  -- Atualizar status do pedido
  UPDATE pedidos
  SET status = 'aprovado', updated_at = NOW()
  WHERE id = p_pedido_id AND status = 'pendente';

  -- Para cada item do pedido, alocar N códigos disponíveis
  FOR v_item IN
    SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = p_pedido_id
  LOOP
    FOR i IN 1..v_item.quantidade LOOP
      -- Pegar o primeiro código disponível com SELECT FOR UPDATE SKIP LOCKED
      SELECT id INTO v_codigo_id
      FROM codigos
      WHERE produto_id = v_item.produto_id
        AND vendido = FALSE
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF v_codigo_id IS NULL THEN
        RAISE EXCEPTION 'Sem estoque disponível para produto %', v_item.produto_id;
      END IF;

      -- Marcar como vendido
      UPDATE codigos
      SET vendido = TRUE,
          vendido_em = NOW(),
          pedido_id = p_pedido_id
      WHERE id = v_codigo_id;
    END LOOP;
  END LOOP;
END;
$$;
```

---

## 7. Tabela de webhook_logs (Supabase)

```sql
CREATE TABLE webhook_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento      TEXT NOT NULL,
  payload     JSONB NOT NULL,
  recebido_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: somente service_role acessa
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas — acesso apenas via service_role key
```

---

## 8. Status do Checkout

| Status | Descrição | Ação no sistema |
|--------|-----------|-----------------|
| `PENDING` | Aguardando pagamento | — |
| `PAID` | Pago ✅ | Entregar códigos (via webhook `checkout.completed`) |
| `EXPIRED` | Expirou sem pagamento | ⚠️ **Sem webhook** — detectar via polling GET /checkouts/one |
| `CANCELLED` | Cancelado | Marcar pedido como `cancelado` |
| `REFUNDED` | Reembolsado | Marcar como `reembolsado` (via webhook `checkout.refunded`) |

**⚠️ Eventos webhook reais do AbacatePay v2** (conforme documentação oficial):
`checkout.completed` · `checkout.refunded` · `checkout.disputed`
**NÃO existem:** `checkout.expired`, `checkout.lost`, `checkout.cancelled`

---

## 9. Variáveis de Ambiente

```env
ABACATEPAY_API_KEY=sua_chave_aqui
ABACATEPAY_WEBHOOK_SECRET=seu_secret_aqui
```

- `ABACATEPAY_API_KEY` → obtida no Dashboard AbacatePay → Chaves de API
- `ABACATEPAY_WEBHOOK_SECRET` → definida por você ao criar o webhook no Dashboard

---

## 10. Checklist antes de ir para produção

- [ ] Webhook configurado com URL HTTPS pública
- [ ] Secret na query string + validação HMAC ativados
- [ ] Dev mode desativado no dashboard
- [ ] Testar com `/transparents/simulate-payment` no sandbox
- [ ] Verificar que `abacate_product_id` está preenchido em todos os produtos ativos
- [ ] Confirmar que a função SQL `entregar_codigos_pedido` está criada no Supabase