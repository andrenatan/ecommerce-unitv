# CLAUDE.md — Plataforma de Gift Cards IPTV

## Visão Geral do Projeto

Plataforma de e-commerce especializada na venda de **códigos de ativação digitais** (gift cards) para aplicativos IPTV como UniTV, entre outros. O cliente realiza cadastro, navega pelos produtos, adiciona ao carrinho, paga via PIX ou cartão de crédito, e recebe o código digital por e-mail e na página de obrigado — tudo automaticamente.

Os dados dos clientes são armazenados no Supabase para integração futura com automações de WhatsApp via n8n.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Backend/API | Next.js API Routes (Route Handlers) |
| Banco de Dados | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Autenticação | Supabase Auth (email/senha) |
| Pagamentos | AbacatePay (PIX + Cartão) |
| E-mail | Resend (transacional) |
| Upload de Imagens | Supabase Storage |
| Deploy | Vercel (recomendado) ou Railway |

---

## Estrutura de Diretórios

```
/
├── app/
│   ├── (store)/                    # Loja pública
│   │   ├── page.tsx                # Home / vitrine de produtos
│   │   ├── produtos/
│   │   │   └── [slug]/page.tsx     # Página do produto
│   │   ├── carrinho/page.tsx       # Carrinho de compras
│   │   ├── checkout/page.tsx       # Checkout (resumo + pagamento)
│   │   ├── obrigado/[orderId]/page.tsx  # Página pós-compra com códigos
│   │   └── conta/
│   │       ├── login/page.tsx
│   │       ├── cadastro/page.tsx
│   │       └── pedidos/page.tsx    # Histórico de pedidos do cliente
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx            # Dashboard admin
│   │       ├── produtos/
│   │       │   ├── page.tsx        # Listar produtos
│   │       │   ├── novo/page.tsx   # Criar produto
│   │       │   └── [id]/page.tsx   # Editar produto
│   │       ├── codigos/
│   │       │   ├── page.tsx        # Gerenciar códigos por produto
│   │       │   └── [produtoId]/page.tsx
│   │       ├── pedidos/page.tsx    # Todos os pedidos
│   │       └── clientes/page.tsx   # Lista de clientes com dados
│   └── api/
│       ├── auth/[...nextauth]/     # Supabase Auth handlers
│       ├── pagamento/
│       │   ├── criar/route.ts      # Criar Checkout AbacatePay
│       │   └── webhook/route.ts    # Webhook AbacatePay (checkout.completed)
│       └── admin/
│           ├── produtos/route.ts
│           └── codigos/route.ts
├── components/
│   ├── store/                      # Componentes da loja
│   │   ├── ProductCard.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── PaymentStatus.tsx
│   ├── admin/                      # Componentes do painel admin
│   │   ├── CodeUploader.tsx        # Upload de códigos em lote
│   │   ├── ClientsTable.tsx
│   │   └── OrdersTable.tsx
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente Supabase browser
│   │   └── server.ts               # Cliente Supabase server
│   ├── abacatepay.ts               # Helper AbacatePay (fetch wrapper)
│   ├── resend.ts                   # Cliente Resend
│   ├── auth.ts                     # Helpers de autenticação
│   └── utils.ts
├── db/
│   ├── schema.ts                   # Schema Drizzle ORM
│   └── migrations/                 # Migrations geradas
├── emails/
│   └── PurchaseConfirmation.tsx    # Template de e-mail (React Email)
├── hooks/
│   ├── useCart.ts                  # Zustand cart store
│   └── useAuth.ts
└── types/
    └── index.ts                    # Tipos globais TypeScript
```

---

## Schema do Banco de Dados (Supabase / Drizzle)

### Tabela: `users` (gerenciada pelo Supabase Auth)
O Supabase Auth cria automaticamente a tabela `auth.users`. Criamos um perfil estendido em `public.profiles`.

```sql
-- profiles (espelho de auth.users com dados extras)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- produtos (gift cards)
CREATE TABLE produtos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  descricao   TEXT,
  imagem_url  TEXT,
  preco       NUMERIC(10,2) NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  app_tipo    TEXT,               -- 'unitv', 'honey', 'pixelplay', etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- codigos (os códigos digitais de cada produto)
CREATE TABLE codigos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES produtos(id),
  codigo      TEXT NOT NULL,
  vendido     BOOLEAN DEFAULT FALSE,
  vendido_em  TIMESTAMPTZ,
  pedido_id   UUID REFERENCES pedidos(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- pedidos
CREATE TABLE pedidos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  status              TEXT DEFAULT 'pendente',  -- pendente | aprovado | cancelado
  total               NUMERIC(10,2) NOT NULL,
  metodo_pagamento    TEXT,                     -- 'pix' | 'cartao'
  abacate_bill_id     TEXT,                     -- ID do checkout no AbacatePay (bill_...)
  abacate_checkout_url TEXT,                    -- URL de pagamento retornada pelo AbacatePay
  email_enviado       BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- itens_pedido
CREATE TABLE itens_pedido (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   UUID NOT NULL REFERENCES pedidos(id),
  produto_id  UUID NOT NULL REFERENCES produtos(id),
  quantidade  INTEGER NOT NULL DEFAULT 1,
  preco_unit  NUMERIC(10,2) NOT NULL
);
```

**Índices importantes:**
```sql
CREATE INDEX idx_codigos_produto_disponivel ON codigos(produto_id) WHERE vendido = FALSE;
CREATE INDEX idx_pedidos_user ON pedidos(user_id);
CREATE INDEX idx_pedidos_abacate_bill ON pedidos(abacate_bill_id);
```

**Row Level Security (RLS):**
- `profiles`: usuário só lê/edita o próprio perfil. Admin lê todos.
- `pedidos`: usuário só vê os próprios. Admin vê todos.
- `codigos`: usuário nunca acessa diretamente. Só via função server-side.
- `produtos`: leitura pública (ativos). Escrita só para admin.

---

## Fluxo de Compra (Crítico — Implementar Exatamente Assim)

```
1. Cliente navega na loja → adiciona produto ao carrinho (localStorage/Zustand)
2. Vai para /checkout → precisa estar logado (redirect para login se não estiver)
3. Preenche checkout → escolhe PIX ou Cartão
4. POST /api/pagamento/criar
   → Sincroniza produtos com AbacatePay via POST /products/create (se necessário)
   → Cria/busca Customer no AbacatePay via POST /customers/create (por email)
   → Cria pedido com status='pendente' no Supabase
   → Cria Checkout no AbacatePay via POST /checkouts/create:
        items: [{ id: abacate_product_id, quantity: N }]
        customerId: abacate_customer_id
        externalId: pedido_uuid (referência interna)
        methods: ["PIX", "CARD"]
        card: { maxInstallments: 1 }  // sem parcelamento para gift cards
        completionUrl: https://seusite.com.br/obrigado/{pedidoId}
        returnUrl: https://seusite.com.br/checkout
   → Salva abacate_bill_id + abacate_checkout_url no pedido
   → Retorna { checkoutUrl: data.url } para o frontend
   → Frontend redireciona cliente para data.url (página hospedada AbacatePay)

5. AbacatePay chama POST /api/pagamento/webhook (evento: checkout.completed)
   → Valida assinatura HMAC com secret do webhook (header de assinatura)
   → Confirma event === 'checkout.completed'
   → Busca pedido pelo externalId (= pedido UUID)
   → Se status === 'PAID':
      a. Atualiza pedido.status = 'aprovado'
      b. Busca N códigos disponíveis (vendido=false) para cada item — transação atômica
      c. Marca códigos como vendido=true, vendido_em=NOW(), pedido_id=X
      d. Envia e-mail via Resend com os códigos
      e. Atualiza pedido.email_enviado = true

6. Cliente é redirecionado para /obrigado/[orderId] (via completionUrl)
   → Página busca pedido e exibe os códigos (se status=aprovado)
   → Se ainda pendente (webhook atrasado), mostra polling/loading a cada 3s
```

**IMPORTANTE:** A entrega dos códigos só acontece após confirmação do webhook. Nunca antes.

---

## Entidades e Regras de Negócio

### Códigos de Ativação
- Cada código é único e de uso único
- Ao ser vendido, recebe `vendido=true` + `pedido_id` + `vendido_em`
- O admin pode importar códigos em lote (CSV ou lista de texto, um por linha)
- O sistema alerta quando o estoque de um produto está baixo (< 5 códigos disponíveis)
- Nunca reutilizar código já vendido — validar antes de qualquer entrega

### Produtos (Gift Cards)
- Cada produto tem imagem, nome, descrição, preço e tipo de app
- Produto só aparece na loja se `ativo=true` E tiver pelo menos 1 código disponível
- O admin pode desativar um produto sem excluir

### Pagamentos
- Fluxo: checkout hospedado pelo AbacatePay — o cliente é redirecionado para `data.url`
- PIX e Cartão de Crédito disponíveis (`methods: ["PIX", "CARD"]`)
- Sem parcelamento para gift cards (`card.maxInstallments: 1`)
- Pedido expira automaticamente pelo AbacatePay; status `EXPIRED` chega via webhook
- Produtos precisam existir no catálogo do AbacatePay antes de criar o checkout
- Clientes são criados/recuperados no AbacatePay por email (único por CPF/email)

### Clientes (para admin)
Visão consolidada por cliente:
- Nome, Telefone, E-mail
- Data do primeiro pedido aprovado
- Produto(s) adquirido(s) (mais recente)
- Data do último pedido aprovado
- Total de pedidos

---

## Painel Administrativo

### Rota base: `/admin`
Protegida por middleware — apenas usuários com `role='admin'` no Supabase.

### Funcionalidades obrigatórias:

**Dashboard `/admin`**
- Total de vendas do dia/mês
- Pedidos recentes
- Alertas de estoque baixo

**Produtos `/admin/produtos`**
- CRUD completo de produtos
- Upload de imagem via Supabase Storage
- Toggle ativo/inativo
- Contador de códigos disponíveis

**Códigos `/admin/codigos/[produtoId]`**
- Listar todos os códigos do produto (disponíveis e vendidos)
- Importar em lote (textarea ou CSV)
- Ver para qual pedido/cliente cada código foi enviado
- Badge visual: `disponível` (verde) / `vendido` (cinza com info)

**Pedidos `/admin/pedidos`**
- Lista com filtros: status, data, método de pagamento
- Detalhes de cada pedido (cliente, itens, códigos entregues)

**Clientes `/admin/clientes`**
- Tabela com: Nome, Telefone, E-mail, Primeira Compra, Produto Adquirido, Última Compra
- Exportar CSV
- Busca por nome/e-mail/telefone

---

## Autenticação

- Usar **Supabase Auth** com email/senha
- Após cadastro, criar registro em `public.profiles` via trigger do Postgres:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, telefone)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'telefone');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
- Role de admin: adicionar `app_metadata: { role: 'admin' }` via Supabase Dashboard ou SQL
- `proxy.ts` (Next.js 16; equivalente ao antigo `middleware.ts`) protege `/admin/*` e verifica role

---

## Integração AbacatePay

**Base URL:** `https://api.abacatepay.com/v2`  
**Auth:** `Authorization: Bearer <ABACATEPAY_API_KEY>` em todas as requisições  
**Valores:** sempre em **centavos** (ex: R$ 29,90 → `2990`)  
**Docs:** https://docs.abacatepay.com

```typescript
// lib/abacatepay.ts
const ABACATE_BASE = 'https://api.abacatepay.com/v2';

const abacateHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
};

// Helper genérico
async function abacateFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${ABACATE_BASE}${path}`, {
    ...options,
    headers: { ...abacateHeaders, ...options?.headers },
  });
  return res.json();
}

export { abacateFetch };
```

**Sincronizar produto com AbacatePay (criar se não existir):**
```typescript
// Ao criar produto no admin, também criar no AbacatePay
// Salvar o ID retornado (prod_...) em produtos.abacate_product_id
const { data } = await abacateFetch('/products/create', {
  method: 'POST',
  body: JSON.stringify({
    externalId: produto.id,          // UUID do produto no Supabase
    name: produto.nome,
    price: Math.round(produto.preco * 100), // em centavos
    currency: 'BRL',
    description: produto.descricao,
    imageUrl: produto.imagem_url,
    // sem 'cycle' = produto avulso (one-time)
  }),
});
// Salvar data.id em produtos.abacate_product_id
```

**Criar/recuperar cliente no AbacatePay:**
```typescript
// Clientes são únicos por email no AbacatePay
// Se já existir, retorna o existente automaticamente
const { data: customer } = await abacateFetch('/customers/create', {
  method: 'POST',
  body: JSON.stringify({
    email: user.email,
    name: user.nome,
    cellphone: user.telefone, // formato: "31999999999"
  }),
});
// customer.id = "cust_..."
```

**Criar Checkout:**
```typescript
const { data: billing } = await abacateFetch('/checkouts/create', {
  method: 'POST',
  body: JSON.stringify({
    items: cartItems.map(item => ({
      id: item.abacate_product_id,   // prod_... do AbacatePay
      quantity: item.quantidade,
    })),
    customerId: customer.id,         // cust_...
    externalId: pedidoId,            // UUID do pedido no Supabase
    methods: ['PIX', 'CARD'],
    card: { maxInstallments: 1 },    // sem parcelamento
    completionUrl: `${process.env.NEXT_PUBLIC_URL}/obrigado/${pedidoId}`,
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/checkout`,
    metadata: { source: 'loja-iptv' },
  }),
});
// billing.url = URL para redirecionar o cliente
// billing.id = "bill_..." — salvar em pedidos.abacate_bill_id
```

**Webhook — validar assinatura HMAC:**
```typescript
// POST /api/pagamento/webhook
// AbacatePay assina o payload com HMAC usando o secret configurado no webhook
// Validar antes de qualquer processamento

import { createHmac } from 'crypto';

function validarAssinaturaAbacate(payload: string, assinaturaRecebida: string): boolean {
  const hmac = createHmac('sha256', process.env.ABACATEPAY_WEBHOOK_SECRET!);
  hmac.update(payload);
  const assinaturaEsperada = hmac.digest('hex');
  return assinaturaEsperada === assinaturaRecebida;
}

// No route handler:
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') ?? '';

  if (!validarAssinaturaAbacate(rawBody, signature)) {
    return Response.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Evento de pagamento concluído: "checkout.completed"
  if (payload.event === 'checkout.completed' && payload.data?.status === 'PAID') {
    const pedidoId = payload.data.externalId;
    // → processar entrega dos códigos
  }

  // Outros eventos relevantes:
  // "checkout.refunded" → marcar pedido como reembolsado
  // "checkout.disputed" → marcar pedido como em_disputa
}
```

**Status do Checkout no AbacatePay:**
| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando pagamento |
| `PAID` | Pago — entregar códigos |

**Eventos de webhook emitidos pelo AbacatePay v2** (não existe `checkout.expired`/`checkout.cancelled`):
| Evento | Descrição |
|--------|-----------|
| `checkout.completed` | Pagamento processado (checar `status === 'PAID'`) |
| `checkout.refunded` | Reembolsado |
| `checkout.disputed` | Em disputa/chargeback |

**Schema atualizado — adicionar campo `abacate_product_id` em `produtos`:**
```sql
ALTER TABLE produtos ADD COLUMN abacate_product_id TEXT;
-- Preenchido automaticamente ao criar produto no painel admin
```

---

## E-mail Transacional (Resend + React Email)

Template obrigatório: **Confirmação de Compra**
- Logo da loja
- Saudação com nome do cliente
- Resumo do pedido (produto, quantidade, valor)
- Seção destacada com o(s) código(s) de ativação
- Instruções de como usar o código no app
- Link para a página `/obrigado/[orderId]` (ver os códigos online também)
- Suporte / contato

```typescript
// lib/resend.ts
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY!);
```

---

## Design e UI

### Identidade Visual
- **Estilo:** Dark mode predominante, visual tech/premium
- **Cores principais:**
  - Background: `#0A0A0F` (quase preto)
  - Card: `#13131A`
  - Accent primário: `#6C3DE8` (roxo elétrico — remete a streaming/tech)
  - Accent secundário: `#00D4FF` (ciano — ativação, digital)
  - Texto: `#F0F0F5`
  - Sucesso: `#00C853`
- **Tipografia:** Inter (corpo) + Space Grotesk (headings)
- **Estética:** Cards com gradiente sutil, bordas com brilho leve, badges neon nos preços
- Referências visuais: dark tech store, estética de marketplace de keys de jogos

### Componentes-chave da loja
- `ProductCard`: imagem do gift card, nome do app, preço em destaque, badge "Entrega Imediata"
- `CartDrawer`: painel lateral deslizante
- `CheckoutForm`: etapas claras — dados pessoais → pagamento → confirmação
- `PaymentStatus`: polling do status do PIX com countdown

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AbacatePay
ABACATEPAY_API_KEY=abc_dev_5LNUuW2mpUzFehPjJbXXU1Wq
ABACATEPAY_WEBHOOK_SECRET=3cabf790ff2af1ccc3a0cb4870b66c9d57502490a5a6b7a83c7d96aa123ba76b

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=contato@seudominio.com.br

# App
NEXT_PUBLIC_URL=https://seudominio.com.br
ADMIN_EMAIL=admin@seudominio.com.br
```

---

## Ordem de Implementação (Fases)

### Fase 1 — Fundação
- [x] Setup Next.js 16 + TypeScript + Tailwind + shadcn/ui
- [x] Configurar Supabase (Auth + Storage + DB)
- [x] Criar schema Drizzle + migrations
- [x] Configurar trigger de criação de perfil
- [x] Setup variáveis de ambiente

### Fase 2 — Autenticação
- [x] Páginas de Login e Cadastro (nome, telefone, email, senha)
- [x] Middleware de proteção de rotas
- [x] Proteção da área admin por role

### Fase 3 — Loja (Storefront)
- [x] Home com grid de produtos
- [x] Página de produto individual
- [x] Carrinho (Zustand, persistido em localStorage)
- [x] Página de checkout

### Fase 4 — Pagamentos
- [x] Integração AbacatePay — helper `lib/abacatepay.ts`
- [x] Sincronização de produtos com AbacatePay ao criar/editar no admin (sync lazy em `/api/pagamento/criar` até a Fase 6 existir)
- [x] Criação de checkout (redirect para página hospedada AbacatePay)
- [x] Webhook `checkout.completed` → entrega atômica de códigos
- [x] Webhook `checkout.refunded` → marcar pedido como `reembolsado`; `checkout.disputed` → `em_disputa`
- [x] Página de obrigado com exibição dos códigos + polling de status

### Fase 5 — E-mail
- [x] Template React Email
- [x] Envio automático após webhook aprovado

### Fase 6 — Painel Admin
- [x] Dashboard com métricas
- [x] CRUD de produtos + upload de imagem
- [x] Importação de códigos em lote
- [x] Visão de pedidos
- [x] Tabela de clientes com todos os campos

### Fase 7 — Polimento
- [x] Alertas de estoque baixo (dashboard admin + "Apenas X disponíveis" no produto)
- [x] Tratamento de erros e edge cases (error.tsx, not-found.tsx, validação RHF+zod)
- [x] Loading states e skeletons
- [x] SEO básico (metadata, og:image dinâmico, sitemap.xml, robots.txt)
- [x] Responsividade mobile

---

## Skills de Referência

Antes de implementar qualquer funcionalidade das áreas abaixo, **leia o arquivo de skill correspondente**:

| Área | Arquivo |
|------|---------|
| Pagamentos AbacatePay | `skills/abacatepay.md` |
| Supabase (clients, RLS, auth, queries) | `skills/supabase-patterns.md` |
| Drizzle ORM (schema, migrations, queries) | `skills/drizzle-conventions.md` |

---

## Regras Críticas para o Claude Code

1. **NUNCA entregar códigos antes de confirmação do webhook** — a lógica de entrega só roda em `/api/pagamento/webhook` após `event === 'checkout.completed'` e `status === 'PAID'`
2. **Transação atômica na entrega:** buscar códigos + marcar como vendido deve ser feito em uma única transação SQL para evitar código duplicado em pagamentos simultâneos
3. **Validar assinatura HMAC do AbacatePay:** verificar header de assinatura antes de qualquer processamento de webhook
4. **Idempotência no webhook:** checar se `pedido.status` já é `'aprovado'` antes de reprocessar (AbacatePay pode reenviar o mesmo evento)
5. **Usar `SUPABASE_SERVICE_ROLE_KEY`** apenas em rotas de servidor (nunca expor no cliente)
6. **RLS ativo** no Supabase para todas as tabelas — usuário nunca acessa código de outro pedido
7. **Sem parcelamento** nos produtos (`card.maxInstallments: 1`)
8. **Estoque checado antes de redirecionar ao AbacatePay:** se não há códigos disponíveis, bloquear checkout para aquele produto
9. **Sincronização AbacatePay:** produto deve ter `abacate_product_id` preenchido antes de criar checkout — validar no servidor
10. **Admin role** verificado tanto no middleware quanto nas API routes (dupla validação)
11. **Logs de webhook:** salvar payload bruto do AbacatePay em tabela `webhook_logs` para debugging e auditoria

---

## Integrações Futuras (n8n / WhatsApp)

Os dados de clientes em `public.profiles` (nome, telefone, email) serão consumidos por automações n8n para:
- Disparo de mensagens via WhatsApp após compra
- Campanhas de reengajamento
- Notificações de novos produtos

**Garantir:** `telefone` salvo no formato `5531999999999` (com DDI+DDD, sem formatação)
