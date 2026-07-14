-- ─── FK profiles → auth.users ────────────────────────────────────────────────
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint

-- ─── Índice parcial de códigos disponíveis ──────────────────────────────────
DROP INDEX IF EXISTS "idx_codigos_produto_disponivel";
--> statement-breakpoint
CREATE INDEX "idx_codigos_produto_disponivel" ON "codigos" USING btree ("produto_id") WHERE "vendido" = false;
--> statement-breakpoint

-- ─── Trigger: criação automática de profile ao cadastrar usuário ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, telefone)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'telefone');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
--> statement-breakpoint

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "profiles_self" ON "profiles"
  FOR ALL USING (auth.uid() = id);
--> statement-breakpoint

ALTER TABLE "pedidos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "pedidos_owner" ON "pedidos"
  FOR SELECT USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "pedidos_insert" ON "pedidos"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint

ALTER TABLE "codigos" ENABLE ROW LEVEL SECURITY;
-- SEM policies públicas — acesso apenas via service_role (supabaseAdmin)
--> statement-breakpoint

ALTER TABLE "produtos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "produtos_public_read" ON "produtos"
  FOR SELECT USING (ativo = TRUE);
-- Escrita apenas via service_role (admin)
--> statement-breakpoint

ALTER TABLE "itens_pedido" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "itens_owner" ON "itens_pedido"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = itens_pedido.pedido_id
        AND pedidos.user_id = auth.uid()
    )
  );
--> statement-breakpoint

ALTER TABLE "webhook_logs" ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas — acesso apenas via service_role (supabaseAdmin)
