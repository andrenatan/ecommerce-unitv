import { useEffect, useState } from "react";

export function usePedidoStatus(pedidoId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "aprovado" || status === "expirado") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/pedidos/${pedidoId}/status`);
      if (!res.ok) return;
      const { status: novoStatus } = await res.json();
      setStatus(novoStatus);

      if (novoStatus === "aprovado" || novoStatus === "expirado") {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pedidoId, status]);

  return status;
}
