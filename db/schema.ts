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
  // pendente | aprovado | cancelado | reembolsado | em_disputa
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
