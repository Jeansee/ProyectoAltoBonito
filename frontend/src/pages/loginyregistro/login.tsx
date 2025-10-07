import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { FaUserLock } from "react-icons/fa"; 
import s from "@/components/home/home.module.css";

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
      <div
        className={`${s.bgFire} hidden md:flex md:w-1/2 items-center justify-center p-10 text-white relative overflow-hidden`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="z-10 text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Todo lo que necesitas, ¡en un solo lugar!</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Inicia sesión para continuar con tu experiencia. 
          </p>
        </motion.div>
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
              className="w-16 h-16 mx-auto rounded-full bg-[#e5d0ac]/40 text-[#c14421] flex items-center justify-center text-2xl font-bold shadow-inner"
            >
              <span className="relative z-10">
                <FaUserLock />
              </span>
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold text-[#1e1e1e]">
              Iniciar sesión
            </h2>
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
              className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
              placeholder="tucorreo@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-600">
              Contraseña
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2
                       rounded-full bg-gradient-to-r from-[#ffb26a] to-[#c14421]
                       text-white px-6 py-3 text-sm font-semibold shadow-md
                       hover:shadow-xl hover:brightness-110 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </motion.button>

          <p className="text-xs text-gray-500 text-center">
            ¿No tienes cuenta?{" "}
            <a
              className="text-[#c14421] hover:underline font-medium"
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
