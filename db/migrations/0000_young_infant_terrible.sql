CREATE TABLE "codigos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"vendido" boolean DEFAULT false,
	"vendido_em" timestamp with time zone,
	"pedido_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"preco_unit" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pendente',
	"total" numeric(10, 2) NOT NULL,
	"metodo_pagamento" text,
	"abacate_bill_id" text,
	"abacate_checkout_url" text,
	"email_enviado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descricao" text,
	"imagem_url" text,
	"preco" numeric(10, 2) NOT NULL,
	"ativo" boolean DEFAULT true,
	"app_tipo" text,
	"abacate_product_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento" text NOT NULL,
	"payload" jsonb NOT NULL,
	"recebido_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "codigos" ADD CONSTRAINT "codigos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codigos" ADD CONSTRAINT "codigos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_codigos_produto_disponivel" ON "codigos" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "idx_pedidos_user" ON "pedidos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pedidos_abacate_bill" ON "pedidos" USING btree ("abacate_bill_id");