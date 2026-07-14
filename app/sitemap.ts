import type { MetadataRoute } from "next";
import { getProdutosDisponiveis } from "@/lib/produtos";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/conta/login`, lastModified: new Date() },
    { url: `${baseUrl}/conta/cadastro`, lastModified: new Date() },
  ];

  try {
    const produtos = await getProdutosDisponiveis();

    const produtoUrls: MetadataRoute.Sitemap = produtos.map((produto) => ({
      url: `${baseUrl}/produtos/${produto.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...paginasEstaticas, ...produtoUrls];
  } catch (error) {
    console.error("[Sitemap] Erro ao buscar produtos, retornando sitemap mínimo:", error);
    return paginasEstaticas;
  }
}
