import Link from "next/link";
import { AlertTriangleIcon, DollarSignIcon, ReceiptIcon, TrendingUpIcon } from "lucide-react";
import { getDashboardStats } from "@/lib/admin/dashboard";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  aprovado: "default",
  cancelado: "destructive",
  reembolsado: "secondary",
  em_disputa: "destructive",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Vendas hoje"
          value={`R$ ${stats.vendasHoje.toFixed(2)}`}
          icon={DollarSignIcon}
        />
        <StatCard
          label="Vendas no mês"
          value={`R$ ${stats.vendasMes.toFixed(2)}`}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Total de pedidos aprovados"
          value={String(stats.totalPedidos)}
          icon={ReceiptIcon}
        />
        <StatCard
          label="Ticket médio"
          value={`R$ ${stats.ticketMedio.toFixed(2)}`}
          icon={DollarSignIcon}
        />
      </div>

      {stats.estoqueBaixo.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangleIcon className="size-4" />
              Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {stats.estoqueBaixo.map((produto) => (
              <Link
                key={produto.id}
                href={`/admin/codigos/${produto.id}`}
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm hover:bg-muted"
              >
                <span>{produto.nome}</span>
                <Badge variant="destructive">{produto.estoque} disponíveis</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.ultimosPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{pedido.profile?.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {pedido.profile?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pedido.createdAt
                      ? new Date(pedido.createdAt).toLocaleDateString("pt-BR")
                      : ""}
                  </TableCell>
                  <TableCell>R$ {parseFloat(pedido.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[pedido.status ?? "pendente"]}>
                      {pedido.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {stats.ultimosPedidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum pedido ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
