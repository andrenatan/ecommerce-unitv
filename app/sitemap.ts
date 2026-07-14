import type { MetadataRoute } from "next";
import { getProdutosDisponiveis } from "@/lib/produtos";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const produtos = await getProdutosDisponiveis();

  const produtoUrls: MetadataRoute.Sitemap = produtos.map((produto) => ({
    url: `${baseUrl}/produtos/${produto.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...produtoUrls,
  ];
}
