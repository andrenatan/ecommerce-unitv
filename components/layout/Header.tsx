"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon, ShoppingCartIcon } from "lucide-react";
import { useCart, useCartCount } from "@/hooks/useCart";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CartDrawer } from "@/components/store/CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCartCount();
  const openCart = useCart((state) => state.open);

  async function handleMobileLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Painel admin tem seu próprio layout/sidebar — não mostrar o header da loja
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          Uni<span className="text-primary">TV</span>{" "}
          <span className="text-secondary">Codes</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}
          >
            Loja
          </Link>
          {userEmail && (
            <Link
              href="/conta/pedidos"
              className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}
            >
              Meus pedidos
            </Link>
          )}

          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCartIcon />
            {count > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
                {count}
              </Badge>
            )}
          </Button>

          <div className="hidden sm:block">
            {userEmail ? (
              <LogoutButton />
            ) : (
              <Link href="/conta/login" className={buttonVariants()}>
                Entrar
              </Link>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Menu">
                  <MenuIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/">Loja</Link>} />
              {userEmail && (
                <DropdownMenuItem render={<Link href="/conta/pedidos">Meus pedidos</Link>} />
              )}
              {userEmail ? (
                <DropdownMenuItem onClick={handleMobileLogout}>Sair</DropdownMenuItem>
              ) : (
                <DropdownMenuItem render={<Link href="/conta/login">Entrar</Link>} />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <CartDrawer />
    </header>
  );
}
