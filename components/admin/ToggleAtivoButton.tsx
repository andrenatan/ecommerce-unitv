"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function ToggleAtivoButton({
  produtoId,
  ativo,
}: {
  produtoId: string;
  ativo: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(ativo);

  async function handleChange(value: boolean) {
    setLoading(true);
    setChecked(value);

    const res = await fetch(`/api/admin/produtos/${produtoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: value }),
    });

    setLoading(false);

    if (!res.ok) {
      setChecked(!value);
      toast.error("Não foi possível atualizar o status");
      return;
    }

    toast.success(value ? "Produto ativado" : "Produto desativado");
    router.refresh();
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleChange}
      disabled={loading}
      aria-label={checked ? "Desativar produto" : "Ativar produto"}
    />
  );
}
