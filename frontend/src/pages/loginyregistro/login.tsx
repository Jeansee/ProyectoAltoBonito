import React, { useState } from "react";
import { motion } from "framer-motion";
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
      setLoading(true);
      setErr(null);
      await login(correo, password);
      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado izquierdo con ilustración / branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 items-center justify-center p-10 text-white relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="z-10 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Bienvenido de nuevo</h1>
          <p className="text-lg text-indigo-100 max-w-md mx-auto">
            Inicia sesión para continuar con tu experiencia.  
            Todo lo que necesitas, en un solo lugar.
          </p>
        </motion.div>

        {/* Figuras decorativas animadas */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 0.3 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute w-72 h-72 bg-white rounded-full top-10 left-10 blur-3xl"
        />
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 0.2 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute w-96 h-96 bg-purple-400 rounded-full bottom-10 right-10 blur-3xl"
        />
      </div>

      {/* Formulario login */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 sm:p-10 bg-gray-50">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold shadow-inner"
            >
              🔒
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Iniciar sesión</h2>
            <p className="text-gray-500 text-sm">Accede con tus credenciales</p>
          </div>

          {err && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200"
            >
              {err}
            </motion.div>
          )}

          <div>
            <label className="block text-sm mb-1 text-gray-600">Correo</label>
            <input
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              type="email"
              className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="tucorreo@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-600">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-60 shadow-md"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </motion.button>

          <p className="text-xs text-gray-500 text-center">
            ¿No tienes cuenta?{" "}
            <a
              className="text-indigo-600 hover:underline font-medium"
              href="/register"
            >
              Regístrate
            </a>
          </p>
        </motion.form>
      </div>
    </div>
  );
}