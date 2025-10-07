import React, { useState } from "react";
import { registerUser } from "@/services/auth.service";
import { isValidEmail, isValidPhoneCL, isStrongPassword } from "@/utils/validators";
import { motion } from "framer-motion";
import { FaUserPlus } from "react-icons/fa";
import s from "@/components/home/home.module.css";

type Form = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
  confirm: string;
  acepto: boolean;
};

const INITIAL: Form = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  password: "",
  confirm: "",
  acepto: false,
};

export default function RegisterPage() {
  const [form, setForm] = useState<Form>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError("Ingresa tu nombre.");
    if (!form.apellido.trim()) return setError("Ingresa tu apellido.");
    if (!isValidEmail(form.correo)) return setError("Correo inválido.");
    if (!isValidPhoneCL(form.telefono)) return setError("Teléfono chileno en formato +569XXXXXXXX.");
    if (!isStrongPassword(form.password))
      return setError("La contraseña debe tener 8+ caracteres, mayúscula, minúscula y número.");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");
    if (!form.acepto) return setError("Debes aceptar los términos.");

    try {
      setLoading(true);
      await registerUser({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        password: form.password,
      });
      window.location.href = "/login";
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) return setError("El correo ya está registrado.");
      if (status === 400) return setError(err?.response?.data?.message ?? "Datos inválidos.");
      return setError(err?.response?.data?.message || "No se pudo registrar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado izquierdo con gradiente (mismo estilo que Login) */}
      <div className={`${s.bgFire} hidden md:flex md:w-1/2 items-center justify-center p-10 text-white relative overflow-hidden`}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="z-10 text-center max-w-md"
        >
          <h1 className="text-4xl font-extrabold mb-4">Crea tu cuenta</h1>
          <p className="text-lg text-white/80">
            Únete y reserva tu espacio ideal.
          </p>
        </motion.div>
      </div>

      {/* Lado derecho con formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 mx-auto rounded-full bg-[#e5d0ac]/40 text-[#c14421] 
                        flex items-center justify-center text-2xl font-bold shadow-inner"
            >
              <span className="relative z-10">
                <FaUserPlus />
              </span>
            </motion.div>

            <h2 className="mt-4 text-2xl font-bold text-[#1e1e1e]">Crear cuenta</h2>
            <p className="text-gray-500 text-sm">Llena el formulario para registrarte</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="telefono"
              placeholder="+56912345678"
              value={form.telefono}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#c14421] outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepto"
              checked={form.acepto}
              onChange={onChange}
              className="h-3 w-3 rounded border-gray-300 accent-[#c14421] focus:ring-[#c14421]"
            />
            Acepto términos y condiciones
          </label>

          {/* Botón con el mismo estilo que en Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2
                       rounded-full bg-gradient-to-r from-[#ffb26a] to-[#c14421]
                       text-white px-6 py-3 text-sm font-semibold shadow-md
                       hover:shadow-xl hover:brightness-110 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </motion.button>

          <p className="text-sm text-center text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-[#c14421] font-medium hover:underline">
              Inicia sesión
            </a>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
