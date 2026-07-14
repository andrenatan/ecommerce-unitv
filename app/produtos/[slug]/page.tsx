import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZapIcon } from "lucide-react";
import { getProdutoDisponivelBySlug } from "@/lib/produtos";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = await getProdutoDisponivelBySlug(slug);

  if (!produto) {
    return { title: "Produto não encontrado | UniTV Codes" };
  }

  const title = `${produto.nome} - R$ ${produto.preco.toFixed(2)} | UniTV Codes`;
  const description =
    produto.descricao ??
    `Compre agora ${produto.nome} e receba o código de ativação na hora.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: produto.imagemUrl ? [{ url: produto.imagemUrl }] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const produto = await getProdutoDisponivelBySlug(slug);

  if (!produto) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-secondary/10 ring-1 ring-border/60">
          {produto.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-6xl font-semibold text-primary/60">
              {produto.nome.slice(0, 2).toUpperCase()}
            </div>
          )}
          <Badge className="absolute left-4 top-4 gap-1 bg-success text-white">
            <ZapIcon className="size-3" />
            Entrega Imediata
          </Badge>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            {produto.appTipo && (
              <span className="text-sm uppercase tracking-wide text-secondary">
                {produto.appTipo}
              </span>
            )}
            <h1 className="font-heading text-3xl font-semibold">{produto.nome}</h1>
          </div>

          {produto.descricao && (
            <p className="text-muted-foreground">{produto.descricao}</p>
          )}

          <p className="font-heading text-3xl font-semibold text-secondary">
            R$ {produto.preco.toFixed(2)}
          </p>

          <AddToCartButton produto={produto} />

          {produto.estoque < 10 ? (
            <p className="text-xs font-medium text-destructive">
              Apenas {produto.estoque} disponíveis — garanta o seu!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {produto.estoque} códigos disponíveis para entrega imediata.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
