"use client";

import { Fragment, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
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

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  em_disputa: "Em disputa",
};

type Pedido = {
  id: string;
  status: string | null;
  total: string;
  metodoPagamento: string | null;
  createdAt: Date | null;
  profile: { nome: string; email: string } | null;
  itens: { quantidade: number; produto: { nome: string } }[];
  codigos: { codigo: string; produtoId: string }[];
};

export function PedidosTable({ pedidos }: { pedidos: Pedido[] }) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Produtos</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => {
          const aberto = expandido.has(pedido.id);
          return (
            <Fragment key={pedido.id}>
              <TableRow className="cursor-pointer" onClick={() => toggle(pedido.id)}>
                <TableCell>
                  {aberto ? (
                    <ChevronDownIcon className="size-4" />
                  ) : (
                    <ChevronRightIcon className="size-4" />
                  )}
                </TableCell>
                <TableCell>
                  {pedido.createdAt
                    ? new Date(pedido.createdAt).toLocaleDateString("pt-BR")
                    : ""}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{pedido.profile?.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {pedido.profile?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-56 truncate">
                  {pedido.itens.map((item) => item.produto.nome).join(", ")}
                </TableCell>
                <TableCell>R$ {parseFloat(pedido.total).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{pedido.metodoPagamento ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[pedido.status ?? "pendente"]}>
                    {STATUS_LABEL[pedido.status ?? "pendente"]}
                  </Badge>
                </TableCell>
              </TableRow>
              {aberto && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/40">
                    <div className="flex flex-col gap-3 py-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          Itens do pedido
                        </p>
                        <ul className="flex flex-col gap-1 text-sm">
                          {pedido.itens.map((item, i) => (
                            <li key={i}>
                              {item.quantidade}× {item.produto.nome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          Códigos entregues
                        </p>
                        {pedido.codigos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum código entregue ainda.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {pedido.codigos.map((codigo) => (
                              <Badge key={codigo.codigo} variant="outline" className="font-mono">
                                {codigo.codigo}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
        {pedidos.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
