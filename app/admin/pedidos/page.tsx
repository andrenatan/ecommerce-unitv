import type { Metadata } from "next";
import { getPedidosAdmin } from "@/lib/admin/pedidos";
import { PedidosStatusFilter } from "@/components/admin/PedidosStatusFilter";
import { PedidosTable } from "@/components/admin/PedidosTable";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pedidos" };

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const pedidos = await getPedidosAdmin(status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Pedidos</h1>
        <PedidosStatusFilter />
      </div>

      <Card>
        <CardContent>
          <PedidosTable pedidos={pedidos} />
        </CardContent>
      </Card>
    </div>
  );
}
