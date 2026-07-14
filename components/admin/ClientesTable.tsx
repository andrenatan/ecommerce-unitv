"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClienteAdmin } from "@/lib/admin/clientes";

function formatarData(data: Date | null) {
  return data ? new Date(data).toLocaleDateString("pt-BR") : "—";
}

function paraCSV(clientes: ClienteAdmin[]): string {
  const cabecalho = [
    "Nome",
    "Telefone",
    "Email",
    "Primeira Compra",
    "Produto Adquirido",
    "Última Compra",
    "Total de Pedidos",
  ];

  const linhas = clientes.map((cliente) =>
    [
      cliente.nome,
      cliente.telefone ?? "",
      cliente.email,
      formatarData(cliente.primeiraCompra),
      cliente.produtoAdquirido ?? "",
      formatarData(cliente.ultimaCompra),
      String(cliente.totalPedidos),
    ]
      .map((valor) => `"${valor.replace(/"/g, '""')}"`)
      .join(",")
  );

  return [cabecalho.join(","), ...linhas].join("\n");
}

export function ClientesTable({ clientes }: { clientes: ClienteAdmin[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.email.toLowerCase().includes(termo) ||
        cliente.telefone?.toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  function handleExportarCSV() {
    const csv = paraCSV(filtrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleExportarCSV}>
          <DownloadIcon className="mr-1 size-4" />
          Exportar CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Primeira compra</TableHead>
            <TableHead>Produto adquirido</TableHead>
            <TableHead>Última compra</TableHead>
            <TableHead>Total de pedidos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtrados.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="font-medium">{cliente.nome}</TableCell>
              <TableCell>{cliente.telefone ?? "—"}</TableCell>
              <TableCell>{cliente.email}</TableCell>
              <TableCell>{formatarData(cliente.primeiraCompra)}</TableCell>
              <TableCell>{cliente.produtoAdquirido ?? "—"}</TableCell>
              <TableCell>{formatarData(cliente.ultimaCompra)}</TableCell>
              <TableCell>{cliente.totalPedidos}</TableCell>
            </TableRow>
          ))}
          {filtrados.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
