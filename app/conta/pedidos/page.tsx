import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { pedidos, profiles } from "@/db/schema";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Meus pedidos | UniTV Codes",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  em_disputa: "Em disputa",
};

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/conta/login?redirectTo=/conta/pedidos");
  }

  const [profile, meusPedidos] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    db.query.pedidos.findMany({
      where: eq(pedidos.userId, user.id),
      orderBy: [desc(pedidos.createdAt)],
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Meus pedidos</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.nome ?? user.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      {meusPedidos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum pedido ainda. Assim que você fizer uma compra, ela aparecerá aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {meusPedidos.map((pedido) => (
            <Card key={pedido.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Pedido #{pedido.id.slice(0, 8)}
                </CardTitle>
                <Badge variant="secondary">
                  {STATUS_LABEL[pedido.status ?? "pendente"]}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {pedido.createdAt
                    ? new Date(pedido.createdAt).toLocaleDateString("pt-BR")
                    : ""}
                </span>
                <span className="font-medium text-foreground">
                  R$ {parseFloat(pedido.total).toFixed(2)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
