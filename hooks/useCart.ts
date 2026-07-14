import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Produto } from '@/types';

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  addItem: (produto: Produto, quantidade?: number) => void;
  removeItem: (produtoId: string) => void;
  updateQuantidade: (produtoId: string, quantidade: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,

      addItem: (produto, quantidade = 1) => {
        const items = get().items;
        const existente = items.find((item) => item.produtoId === produto.id);

        if (existente) {
          set({
            items: items.map((item) =>
              item.produtoId === produto.id
                ? { ...item, quantidade: item.quantidade + quantidade }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                produtoId: produto.id,
                nome: produto.nome,
                slug: produto.slug,
                preco: produto.preco,
                imagemUrl: produto.imagemUrl,
                quantidade,
              },
            ],
          });
        }
        set({ isOpen: true });
      },

      removeItem: (produtoId) => {
        set({ items: get().items.filter((item) => item.produtoId !== produtoId) });
      },

      updateQuantidade: (produtoId, quantidade) => {
        if (quantidade < 1) {
          get().removeItem(produtoId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.produtoId === produtoId ? { ...item, quantidade } : item
          ),
        });
      },

      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function useCartCount() {
  return useCart((state) =>
    state.items.reduce((total, item) => total + item.quantidade, 0)
  );
}

export function useCartTotal() {
  return useCart((state) =>
    state.items.reduce((total, item) => total + item.preco * item.quantidade, 0)
  );
}
