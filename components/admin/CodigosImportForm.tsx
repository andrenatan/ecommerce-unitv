"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CodigosImportForm({
  produtoId,
  codigosExistentes,
}: {
  produtoId: string;
  codigosExistentes: string[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);

  const existentesSet = useMemo(
    () => new Set(codigosExistentes.map((c) => c.toLowerCase())),
    [codigosExistentes]
  );

  const linhasLimpas = texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  const duplicadosNoTexto = linhasLimpas.filter(
    (linha, i) => linhasLimpas.findIndex((l) => l.toLowerCase() === linha.toLowerCase()) !== i
  );
  const jaExistentes = linhasLimpas.filter((linha) => existentesSet.has(linha.toLowerCase()));
  const totalDuplicados = new Set(
    [...duplicadosNoTexto, ...jaExistentes].map((c) => c.toLowerCase())
  ).size;

  async function handleImportar() {
    setLoading(true);
    setConfirmAberto(false);

    try {
      const res = await fetch(`/api/admin/codigos/${produtoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigos: linhasLimpas }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Não foi possível importar", { description: data.error });
        return;
      }

      toast.success(`${data.importados} código(s) importado(s)!`);
      setTexto("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Importar códigos em lote</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          rows={6}
          placeholder={"Um código por linha\nEx:\nUNITV-ABC123\nUNITV-DEF456"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Button
          onClick={() => setConfirmAberto(true)}
          disabled={loading || linhasLimpas.length === 0}
        >
          {loading ? "Importando..." : `Importar ${linhasLimpas.length || ""} código(s)`}
        </Button>
      </CardContent>

      <AlertDialog open={confirmAberto} onOpenChange={setConfirmAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importação</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a importar {linhasLimpas.length} código(s) para este
              produto.
              {totalDuplicados > 0 && (
                <span className="mt-2 block font-medium text-destructive">
                  Atenção: {totalDuplicados} código(s) parecem duplicados (repetidos no
                  texto ou já cadastrados). Eles serão importados normalmente — revise a
                  lista antes de continuar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportar}>Confirmar importação</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
