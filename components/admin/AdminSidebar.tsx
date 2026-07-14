"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  StoreIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: PackageIcon },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCartIcon },
  { href: "/admin/clientes", label: "Clientes", icon: UsersIcon },
];

export function AdminSidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/admin" className="font-heading text-lg font-semibold text-sidebar-foreground">
          Uni<span className="text-primary">TV</span> Admin
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-sidebar-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <StoreIcon className="size-3.5" />
          Ver loja
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
