import type { Metadata } from "next";
import { getProdutosDisponiveis } from "@/lib/produtos";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata: Metadata = {
  title: "UniTV Codes — Gift Cards IPTV | Entrega Imediata",
  description:
    "Compre códigos de ativação digitais para os melhores aplicativos de IPTV e receba na hora, por e-mail e na tela de confirmação.",
  openGraph: {
    title: "UniTV Codes — Gift Cards IPTV | Entrega Imediata",
    description:
      "Compre códigos de ativação digitais para os melhores aplicativos de IPTV e receba na hora.",
  },
};

export default async function Home() {
  const produtos = await getProdutosDisponiveis();

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_45%)] opacity-25" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-20">
          <span className="rounded-full border border-secondary/40 px-3 py-1 text-xs font-medium text-secondary">
            Ativação 100% digital
          </span>
          <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Códigos de ativação para os melhores apps de{" "}
            <span className="text-primary">IPTV</span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Compre agora e receba seu código de ativação por e-mail e na tela de
            confirmação, na hora — sem espera, sem burocracia.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h2 className="mb-6 font-heading text-xl font-semibold">
          Produtos disponíveis
        </h2>

        {produtos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Nenhum produto disponível no momento. Volte em breve!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
