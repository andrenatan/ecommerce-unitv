import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        }}
      >
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
          <span>Uni</span>
          <span style={{ color: "#6C3DE8" }}>TV</span>
          <span style={{ marginLeft: 20, color: "#00D4FF" }}>Codes</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#9A9AAD" }}>
          Gift Cards IPTV — Entrega Imediata
        </div>
      </div>
    ),
    { ...size }
  );
}
