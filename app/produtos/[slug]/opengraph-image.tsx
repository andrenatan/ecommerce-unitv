import { ImageResponse } from "next/og";
import { getProdutoDisponivelBySlug } from "@/lib/produtos";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produto = await getProdutoDisponivelBySlug(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0F",
          color: "#F0F0F5",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#9A9AAD" }}>
          Uni<span style={{ color: "#6C3DE8" }}>TV</span> Codes
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 72, fontWeight: 700 }}>
          {produto?.nome ?? "Produto"}
        </div>
        {produto && (
          <div style={{ display: "flex", marginTop: 24, fontSize: 56, color: "#00D4FF" }}>
            R$ {produto.preco.toFixed(2)}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
