import { createContext, useContext, useState } from "react";
import type { Modalidad } from "@/services/reservas.service";

export interface CartItem {
  recursoId: string;
  nombre: string;
  modalidad: Modalidad;
  // Para POR_HORA / BLOQUE
  desde?: string;
  hasta?: string;
  // Para DIA_COMPLETO
  fecha?: string;
  // Monto del ítem (precalculado en UI)
  precio: number;
}

interface ReservaCartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (recursoId: string) => void;
  clearCart: () => void;
  total: number;
}

const ReservaCartContext = createContext<ReservaCartContextType | undefined>(undefined);

export function ReservaCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.recursoId === item.recursoId);
      if (existing) return prev.map((p) => (p.recursoId === item.recursoId ? item : p));
      return [...prev, item];
    });
  };

  const removeFromCart = (recursoId: string) =>
    setCart((prev) => prev.filter((p) => p.recursoId !== recursoId));

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, i) => acc + i.precio, 0);

  return (
    <ReservaCartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </ReservaCartContext.Provider>
  );
}

export function useReservaCart() {
  const ctx = useContext(ReservaCartContext);
  if (!ctx) throw new Error("useReservaCart debe usarse dentro de <ReservaCartProvider>");
  return ctx;
}
