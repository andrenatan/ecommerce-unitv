# SKILL: Drizzle ORM — Convenções do Projeto

Consulte este arquivo antes de criar ou modificar schema, migrations ou queries com Drizzle ORM.  
Este projeto usa **Drizzle ORM + Supabase PostgreSQL**.

---

## 1. Instalação e Setup

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

```typescript
// db/index.ts — conexão única, reutilizada
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Modo pooling para Next.js (serverless)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

```env
# .env
# Usar a connection string do Supabase com pgbouncer para serverless:
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

```typescript
// drizzle.config.ts (raiz do projeto)
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## 2. Schema Completo (db/schema.ts)

```typescript
import {
  pgTable, uuid, text, numeric, boolean, timestamp, integer, jsonb, index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── PROFILES ────────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id:        uuid('id').primaryKey(),  // mesmo ID do auth.users
  nome:      text('nome').notNull(),
  telefone:  text('telefone'),
  email:     text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
export const produtos = pgTable('produtos', {
  id:                uuid('id').primaryKey().defaultRandom(),
  nome:              text('nome').notNull(),
  slug:              text('slug').unique().notNull(),
  descricao:         text('descricao'),
  imagemUrl:         text('imagem_url'),
  preco:             numeric('preco', { precision: 10, scale: 2 }).notNull(),
  ativo:             boolean('ativo').default(true),
  appTipo:           text('app_tipo'),   // 'unitv', 'honey', 'pixelplay', etc.
  abacateProductId:  text('abacate_product_id'), // prod_... do AbacatePay
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────
export const pedidos = pgTable('pedidos', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => profiles.id),
  status:             text('status').default('pendente'),
  // pendente | aprovado | cancelado | expirado | reembolsado
  total:              numeric('total', { precision: 10, scale: 2 }).notNull(),
  metodoPagamento:    text('metodo_pagamento'),  // 'pix' | 'cartao'
  abacateBillId:      text('abacate_bill_id'),
  abacateCheckoutUrl: text('abacate_checkout_url'),
  emailEnviado:       boolean('email_enviado').default(false),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx:        index('idx_pedidos_user').on(table.userId),
  abacateBillIdx: index('idx_pedidos_abacate_bill').on(table.abacateBillId),
}));

// ─── ITENS DO PEDIDO ─────────────────────────────────────────────────────────
export const itensPedido = pgTable('itens_pedido', {
  id:         uuid('id').primaryKey().defaultRandom(),
  pedidoId:   uuid('pedido_id').notNull().references(() => pedidos.id),
  produtoId:  uuid('produto_id').notNull().references(() => produtos.id),
  quantidade: integer('quantidade').notNull().default(1),
  precoUnit:  numeric('preco_unit', { precision: 10, scale: 2 }).notNull(),
});

// ─── CÓDIGOS ─────────────────────────────────────────────────────────────────
export const codigos = pgTable('codigos', {
  id:        uuid('id').primaryKey().defaultRandom(),
  produtoId: uuid('produto_id').notNull().references(() => produtos.id),
  codigo:    text('codigo').notNull(),
  vendido:   boolean('vendido').default(false),
  vendidoEm: timestamp('vendido_em', { withTimezone: true }),
  pedidoId:  uuid('pedido_id').references(() => pedidos.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  produtoDisponivel: index('idx_codigos_produto_disponivel').on(table.produtoId),
}));

// ─── WEBHOOK LOGS ─────────────────────────────────────────────────────────────
export const webhookLogs = pgTable('webhook_logs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  evento:      text('evento').notNull(),
  payload:     jsonb('payload').notNull(),
  recebidoEm:  timestamp('recebido_em', { withTimezone: true }).defaultNow(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────
export const profilesRelations = relations(profiles, ({ many }) => ({
  pedidos: many(pedidos),
}));

export const produtosRelations = relations(produtos, ({ many }) => ({
  codigos:      many(codigos),
  itensPedido:  many(itensPedido),
}));

export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  profile:     one(profiles, { fields: [pedidos.userId], references: [profiles.id] }),
  itens:       many(itensPedido),
  codigos:     many(codigos),
}));

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido:  one(pedidos, { fields: [itensPedido.pedidoId], references: [pedidos.id] }),
  produto: one(produtos, { fields: [itensPedido.produtoId], references: [produtos.id] }),
}));

export const codigosRelations = relations(codigos, ({ one }) => ({
  produto: one(produtos, { fields: [codigos.produtoId], references: [produtos.id] }),
  pedido:  one(pedidos, { fields: [codigos.pedidoId], references: [pedidos.id] }),
}));
```

---

## 3. Migrations

```bash
# Gerar migration após alterar schema
npx drizzle-kit generate

# Aplicar migrations no banco
npx drizzle-kit migrate

# Inspecionar estado atual
npx drizzle-kit studio
```

**Convenção:** nunca editar arquivos dentro de `db/migrations/` manualmente. Sempre via `drizzle-kit generate`.

---

## 4. Queries Comuns

### Buscar produtos ativos com contagem de estoque
```typescript
import { db } from '@/db';
import { produtos, codigos } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

const result = await db
  .select({
    produto: produtos,
    estoque: count(codigos.id).as('estoque'),
  })
  .from(produtos)
  .leftJoin(codigos, and(
    eq(codigos.produtoId, produtos.id),
    eq(codigos.vendido, false)
  ))
  .where(eq(produtos.ativo, true))
  .groupBy(produtos.id)
  .having(sql`count(${codigos.id}) > 0`);
```

### Buscar pedido completo (página obrigado)
```typescript
import { db } from '@/db';
import { eq } from 'drizzle-orm';

const pedido = await db.query.pedidos.findFirst({
  where: eq(pedidos.id, pedidoId),
  with: {
    itens: {
      with: { produto: true },
    },
    codigos: {
      columns: { codigo: true, produtoId: true },
    },
    profile: {
      columns: { nome: true, email: true },
    },
  },
});
```

### Inserir pedido + itens em transação
```typescript
import { db } from '@/db';

const resultado = await db.transaction(async (tx) => {
  const [pedido] = await tx.insert(pedidos).values({
    userId: user.id,
    total: totalString,   // Drizzle espera string para numeric
    status: 'pendente',
  }).returning();

  await tx.insert(itensPedido).values(
    cartItems.map(item => ({
      pedidoId: pedido.id,
      produtoId: item.id,
      quantidade: item.quantidade,
      precoUnit: item.preco.toString(),
    }))
  );

  return pedido;
});
```

### Importar códigos em lote (painel admin)
```typescript
const linhas = textoArea.split('\n').map(l => l.trim()).filter(Boolean);

await db.insert(codigos).values(
  linhas.map(linha => ({
    produtoId: produtoId,
    codigo: linha,
    vendido: false,
  }))
);
```

### Dashboard admin — total de vendas do dia
```typescript
import { sql, gte } from 'drizzle-orm';

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const [{ totalDia }] = await db
  .select({
    totalDia: sql<number>`COALESCE(SUM(CAST(${pedidos.total} AS numeric)), 0)`,
  })
  .from(pedidos)
  .where(and(
    eq(pedidos.status, 'aprovado'),
    gte(pedidos.createdAt, hoje)
  ));
```

---

## 5. Atenção: Tipos Numeric no Drizzle

O Drizzle retorna campos `numeric` como **string** por padrão (comportamento do driver postgres).

```typescript
// ❌ Errado
const total = pedido.total + 10;

// ✅ Correto
const total = parseFloat(pedido.total) + 10;

// ✅ Ao inserir, converter para string
await db.insert(pedidos).values({
  total: preco.toFixed(2),  // "29.90"
});
```

---

## 6. Scripts package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```
