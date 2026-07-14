import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCodigosDoProdutoAdmin } from "@/lib/admin/codigos";

export const metadata: Metadata = { title: "Códigos" };
import { CodigosImportForm } from "@/components/admin/CodigosImportForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCodigosPage({
  params,
}: {
  params: Promise<{ produtoId: string }>;
}) {
  const { produtoId } = await params;
  const resultado = await getCodigosDoProdutoAdmin(produtoId);

  if (!resultado) {
    notFound();
  }

  const { produto, codigos } = resultado;
  const disponiveis = codigos.filter((c) => !c.vendido).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{produto.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {disponiveis} disponíveis de {codigos.length} no total
        </p>
      </div>

      <CodigosImportForm
        produtoId={produtoId}
        codigosExistentes={codigos.map((c) => c.codigo)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos os códigos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendido em</TableHead>
                <TableHead>Cliente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codigos.map((codigo) => (
                <TableRow key={codigo.id}>
                  <TableCell className="font-mono">{codigo.codigo}</TableCell>
                  <TableCell>
                    {codigo.vendido ? (
                      <Badge variant="secondary">Vendido</Badge>
                    ) : (
                      <Badge className="bg-success text-white">Disponível</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {codigo.vendidoEm
                      ? new Date(codigo.vendidoEm).toLocaleString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {codigo.pedido?.profile
                      ? `${codigo.pedido.profile.nome} (${codigo.pedido.profile.email})`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {codigos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum código cadastrado ainda.
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
