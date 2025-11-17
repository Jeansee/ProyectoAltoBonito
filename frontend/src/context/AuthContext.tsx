import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, type User } from "@/services/auth.service";
import api from "@/services/api";

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (correo: string, password: string) => Promise<User>;
  register: (p: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    password: string;
    whatsapp?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User, token?: string) => void;

  // 🔥 Necesario para Google login
  setTokenAndRefresh: (token: string) => Promise<void>;
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

  // Carga inicial desde localStorage
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      try {
        setUser(JSON.parse(u) as User);
        setToken(t);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else if (t && !u) {
      setToken(t);
      fetchMe().catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      });
    }
  }, []);

  // --- Helper para cargar datos del usuario ---
  const fetchMe = async () => {
    const { data } = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (data?.token && typeof data.token === "string") {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }

    const u: User = data?.user ?? data;
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const updateUser = (u: User, t?: string) => {
    setUser(u);
    if (t) {
      setToken(t);
      localStorage.setItem("token", t);
    }
    localStorage.setItem("user", JSON.stringify(u));
  };

  const login = async (correo: string, password: string): Promise<User> => {
    const { user, token } = await loginUser({ correo, password });
    updateUser(user, token);
    return user;
  };

  const register = async (p: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    password: string;
    whatsapp?: string;
  }) => {
    const { user, token } = await registerUser(p);
    updateUser(user, token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // 🔥 Función clave para Google Login (mínimo necesario)
  const setTokenAndRefresh = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    await fetchMe(); // carga los datos del usuario
  };

  return (
    <Ctx.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        setTokenAndRefresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
