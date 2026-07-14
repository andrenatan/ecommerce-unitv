import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("imagem") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `produtos/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("imagens")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[Admin] Erro ao fazer upload de imagem:", error);
    return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("imagens").getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
