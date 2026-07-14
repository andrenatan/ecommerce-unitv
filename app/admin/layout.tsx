import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { template: "%s | Admin UniTV Codes", default: "Painel Admin | UniTV Codes" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="admin-theme flex min-h-screen w-full bg-background text-foreground">
      <AdminSidebar userEmail={user?.email ?? null} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
