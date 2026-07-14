import type { Metadata } from "next";
import { getClientesAdmin } from "@/lib/admin/clientes";
import { ClientesTable } from "@/components/admin/ClientesTable";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Clientes" };

export default async function AdminClientesPage() {
  const clientes = await getClientesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">Clientes</h1>

      <Card>
        <CardContent>
          <ClientesTable clientes={clientes} />
        </CardContent>
      </Card>
    </div>
  );
}
