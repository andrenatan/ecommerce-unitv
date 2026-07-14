"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProdutoExistente = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  preco: string;
  appTipo: string | null;
  ativo: boolean | null;
  imagemUrl: string | null;
};

export function ProdutoForm({ produto }: { produto?: ProdutoExistente }) {
  const router = useRouter();
  const isEdit = Boolean(produto);

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [slug, setSlug] = useState(produto?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [preco, setPreco] = useState(produto?.preco ?? "");
  const [appTipo, setAppTipo] = useState(produto?.appTipo ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [imagemUrl, setImagemUrl] = useState(produto?.imagemUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleNomeChange(value: string) {
    setNome(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  async function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("imagem", file);

    try {
      const res = await fetch("/api/admin/produtos/upload-imagem", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Falha no upload da imagem", { description: data.error });
        return;
      }

      setImagemUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nome,
      slug,
      descricao: descricao || null,
      preco: parseFloat(preco),
      appTipo: appTipo || null,
      ativo,
      imagemUrl: imagemUrl || null,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/produtos/${produto!.id}` : "/api/admin/produtos",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error("Não foi possível salvar o produto", { description: data.error });
        return;
      }

      toast.success(isEdit ? "Produto atualizado!" : "Produto criado!");
      router.push("/admin/produtos");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isEdit ? "Editar produto" : "Novo produto"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              required
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={3}
              value={descricao ?? ""}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                required
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="appTipo">Tipo de app</Label>
              <Input
                id="appTipo"
                placeholder="unitv, honey, pixelplay..."
                value={appTipo ?? ""}
                onChange={(e) => setAppTipo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imagem">Imagem</Label>
            <Input id="imagem" type="file" accept="image/*" onChange={handleImagemChange} />
            {uploading && <p className="text-xs text-muted-foreground">Enviando imagem...</p>}
            {imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagemUrl}
                alt="Preview"
                className="mt-2 h-32 w-32 rounded-lg object-cover ring-1 ring-border"
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="ativo">Produto ativo</Label>
            <Switch id="ativo" checked={ativo ?? true} onCheckedChange={setAtivo} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving || uploading} className="w-full">
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar produto"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
