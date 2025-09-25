import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true); setErr(null);
      await login(correo, password);
      window.location.href = "/"; // o navigate("/")
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        {err && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{err}</div>}
        <div>
          <label className="block text-sm mb-1">Correo</label>
          <input value={correo} onChange={e=>setCorreo(e.target.value)} type="email"
                 className="w-full border rounded-lg px-3 py-2 focus:ring" />
        </div>
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password"
                 className="w-full border rounded-lg px-3 py-2 focus:ring" />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <p className="text-xs text-gray-500 text-center">
          ¿No tienes cuenta? <a className="text-blue-600 hover:underline" href="/register">Regístrate</a>
        </p>
      </form>
    </div>
  );
}
