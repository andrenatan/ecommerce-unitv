export type Produto = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagemUrl: string | null;
  preco: number;
  appTipo: string | null;
  estoque: number;
};

export type CartItem = {
  produtoId: string;
  nome: string;
  slug: string;
  preco: number;
  imagemUrl: string | null;
  quantidade: number;
};
