import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, type User } from "@/services/auth.service";

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (correo: string, password: string) => Promise<void>;
  register: (p: {
    nombre: string; apellido: string; correo: string; telefono: string; password: string; whatsapp?: string;
  }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      try { setUser(JSON.parse(u) as User); setToken(t); }
      catch { localStorage.removeItem("token"); localStorage.removeItem("user"); }
    }
  }, []);

  const persist = (u: User, t: string) => {
    setUser(u); setToken(t);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const login = async (correo: string, password: string) => {
    const { user, token } = await loginUser({ correo, password });
    persist(user, token);
  };

  const register = async (p: {
    nombre: string; apellido: string; correo: string; telefono: string; password: string; whatsapp?: string;
  }) => {
    const { user, token } = await registerUser(p);
    persist(user, token);
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("token"); localStorage.removeItem("user");
    window.location.href = "/";
  };

  return <Ctx.Provider value={{ user, token, login, register, logout }}>{children}</Ctx.Provider>;
}
