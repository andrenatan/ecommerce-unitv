import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirecionar não-logados que tentam acessar checkout, pedidos ou a página de obrigado
  // (login/cadastro dentro de /conta precisam ficar acessíveis a não-logados)
  if (
    !user &&
    (path.startsWith('/checkout') ||
      path.startsWith('/conta/pedidos') ||
      path.startsWith('/obrigado'))
  ) {
    const redirectUrl = new URL('/conta/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Proteger API admin — responder com erro JSON (não é navegação de página)
  if (path.startsWith('/api/admin')) {
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Proteger área admin — verificar role
  if (path.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/conta/login', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
    const role = user.app_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/conta/pedidos/:path*',
    '/obrigado/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
