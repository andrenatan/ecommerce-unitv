"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyCodeButton({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  return (
    <Button variant="outline" size="icon-sm" onClick={handleCopy} aria-label="Copiar código">
      {copiado ? <CheckIcon className="text-success" /> : <CopyIcon />}
    </Button>
  );
}
