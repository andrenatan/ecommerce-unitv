import { notFound } from "next/navigation";
import { getProdutoByIdAdmin } from "@/lib/admin/produtos";
import { ProdutoForm } from "@/components/admin/ProdutoForm";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produto = await getProdutoByIdAdmin(id);

  if (!produto) {
    notFound();
  }

  return <ProdutoForm produto={produto} />;
}
