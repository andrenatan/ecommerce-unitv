import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, TicketIcon } from "lucide-react";
import { getProdutosAdmin } from "@/lib/admin/produtos";

export const metadata: Metadata = { title: "Produtos" };
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleAtivoButton } from "@/components/admin/ToggleAtivoButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminProdutosPage() {
  const produtos = await getProdutosAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Produtos</h1>
        <Link href="/admin/produtos/novo" className={buttonVariants()}>
          <PlusIcon className="mr-1 size-4" />
          Novo produto
        </Link>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>R$ {parseFloat(produto.preco).toFixed(2)}</TableCell>
                  <TableCell>{produto.appTipo ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={produto.estoque < 5 ? "destructive" : "secondary"}>
                      {produto.estoque} disponíveis
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ToggleAtivoButton produtoId={produto.id} ativo={produto.ativo ?? true} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/codigos/${produto.id}`}>
                        <Button variant="outline" size="sm">
                          <TicketIcon className="mr-1 size-3.5" />
                          Códigos
                        </Button>
                      </Link>
                      <Link href={`/admin/produtos/${produto.id}`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum produto cadastrado ainda.
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
