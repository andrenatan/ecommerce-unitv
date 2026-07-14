# SKILL: Supabase — Padrões do Projeto

Consulte este arquivo sempre que for criar clients Supabase, escrever queries, configurar RLS ou trabalhar com autenticação.

---

## 1. Clients — Regra de Ouro

**Nunca use o mesmo client para browser e servidor.**

```typescript
// lib/supabase/client.ts — APENAS em Client Components ('use client')
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts — APENAS em Server Components, Route Handlers, Server Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/admin.ts — APENAS em Route Handlers/Server Actions que precisam bypassar RLS
// NUNCA expor no cliente
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ← service_role bypassa RLS
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

**Regra:** Webhook handlers e entregas de código → sempre `supabaseAdmin`. Queries de loja → sempre `createClient()` do server.

---

## 2. Proxy (Proteger Rotas)

> No Next.js 16, o arquivo `middleware.ts` foi renomeado para `proxy.ts` (a função exportada também muda de `middleware` para `proxy`). O comportamento é idêntico.

```typescript
// proxy.ts (raiz do projeto)
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirecionar não-logados que tentam acessar checkout/conta
  if (!user && (path.startsWith('/checkout') || path.startsWith('/conta'))) {
    return NextResponse.redirect(new URL('/conta/login', request.url));
  }

  // Proteger área admin — verificar role
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/conta/login', request.url));
    }
    // Checar role no app_metadata
    const role = user.app_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/checkout/:path*', '/conta/:path*', '/admin/:path*'],
};
```

---

## 3. Autenticação — Cadastro com Perfil

```typescript
// Cadastro (app/conta/cadastro/page.tsx ou Server Action)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome,
      telefone: telefone.replace(/\D/g, ''), // guardar só números: 5531999999999
    },
  },
});

// O trigger do Postgres cria automaticamente o registro em public.profiles
// Trigger SQL (já no CLAUDE.md):
// CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users ...
```

```typescript
// Login
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Logout
await supabase.auth.signOut();

// Pegar usuário atual no Server Component
const { data: { user } } = await supabase.auth.getUser(); // ← SEMPRE getUser(), não getSession()
```

**⚠️ NUNCA use `getSession()` no servidor** — use sempre `getUser()` que faz verificação no servidor.

---

## 4. Row Level Security (RLS) — Políticas do Projeto

### profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê/edita apenas o próprio perfil
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Admin lê todos (via service_role — não precisa de policy)
```

### pedidos
```sql
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas os próprios pedidos
CREATE POLICY "pedidos_owner" ON pedidos
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário cria pedido para si mesmo
CREATE POLICY "pedidos_insert" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### codigos
```sql
ALTER TABLE codigos ENABLE ROW LEVEL SECURITY;
-- SEM policies públicas — acesso apenas via service_role (supabaseAdmin)
-- Nunca expor códigos diretamente ao cliente via anon key
```

### produtos
```sql
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Leitura pública dos produtos ativos
CREATE POLICY "produtos_public_read" ON produtos
  FOR SELECT USING (ativo = TRUE);

-- Escrita apenas via service_role (admin)
```

### itens_pedido
```sql
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itens_owner" ON itens_pedido
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = itens_pedido.pedido_id
        AND pedidos.user_id = auth.uid()
    )
  );
```

---

## 5. Queries Comuns

### Buscar pedido com itens e códigos (page obrigado)
```typescript
const { data: pedido } = await supabaseAdmin
  .from('pedidos')
  .select(`
    id, status, total, created_at,
    itens_pedido (
      quantidade, preco_unit,
      produtos ( nome, imagem_url, app_tipo )
    ),
    codigos ( codigo, produto_id )
  `)
  .eq('id', pedidoId)
  .eq('user_id', user.id)  // garantir que é o dono
  .single();
```

### Buscar produtos com estoque disponível (loja)
```typescript
const { data: produtos } = await supabase
  .from('produtos')
  .select(`
    id, nome, slug, descricao, imagem_url, preco, app_tipo,
    codigos ( count )
  `)
  .eq('ativo', true)
  .gt('codigos.count', 0);  // só com estoque
```

### Verificar estoque antes do checkout
```typescript
const { count } = await supabaseAdmin
  .from('codigos')
  .select('*', { count: 'exact', head: true })
  .eq('produto_id', produtoId)
  .eq('vendido', false);

if (!count || count < quantidadeNecessaria) {
  throw new Error('Estoque insuficiente');
}
```

### Painel admin — visão de clientes
```typescript
const { data: clientes } = await supabaseAdmin
  .from('profiles')
  .select(`
    id, nome, email, telefone, created_at,
    pedidos (
      id, status, created_at,
      itens_pedido (
        produtos ( nome )
      )
    )
  `)
  .order('created_at', { ascending: false });
```

---

## 6. Definir Admin via SQL

```sql
-- Executar no SQL Editor do Supabase para promover usuário a admin
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'seu-email@dominio.com.br';
```

---

## 7. Polling de Status (Página Obrigado)

```typescript
// hooks/usePedidoStatus.ts
import { useEffect, useState } from 'react';

export function usePedidoStatus(pedidoId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === 'aprovado' || status === 'expirado') return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/pedidos/${pedidoId}/status`);
      const { status: novoStatus } = await res.json();
      setStatus(novoStatus);

      if (novoStatus === 'aprovado' || novoStatus === 'expirado') {
        clearInterval(interval);
      }
    }, 3000); // checar a cada 3 segundos

    return () => clearInterval(interval);
  }, [pedidoId, status]);

  return status;
}
```

---

## 8. Supabase Storage (Imagens de Produtos)

```typescript
// Upload de imagem no painel admin
const file = formData.get('imagem') as File;
const ext = file.name.split('.').pop();
const fileName = `produtos/${crypto.randomUUID()}.${ext}`;

const { error } = await supabaseAdmin.storage
  .from('imagens')        // nome do bucket no Supabase Storage
  .upload(fileName, file, { contentType: file.type, upsert: false });

// URL pública
const { data: { publicUrl } } = supabaseAdmin.storage
  .from('imagens')
  .getPublicUrl(fileName);

// Salvar publicUrl em produtos.imagem_url
```

**Configurar bucket `imagens` como público no Supabase Dashboard → Storage → Policies.**

---

## 9. Variáveis de Ambiente

```env
# Seguras para o cliente (anon key tem RLS)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# NUNCA expor no cliente — bypassa RLS
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
