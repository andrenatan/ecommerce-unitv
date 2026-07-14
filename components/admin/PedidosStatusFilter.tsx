"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PEDIDO_STATUS } from "@/lib/admin/pedido-status";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  em_disputa: "Em disputa",
};

export function PedidosStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusAtual = searchParams.get("status") ?? "todos";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todos") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/admin/pedidos?${params.toString()}`);
  }

  return (
    <Select value={statusAtual} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos os status</SelectItem>
        {PEDIDO_STATUS.map((status) => (
          <SelectItem key={status} value={status}>
            {STATUS_LABEL[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
