import React, { useState } from "react";
import { registerUser } from "@/services/auth.service";
import { isValidEmail, isValidPhoneCL, isStrongPassword } from "@/utils/validators";
import { motion } from "framer-motion";

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
      {/* Lado izquierdo con imagen */}
      <div className="hidden md:flex w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1400&q=80"
          alt="Fondo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 flex flex-col justify-center items-center text-white px-10">
          <h1 className="text-4xl font-bold mb-4 text-center">
            Bienvenido a nuestra comunidad
          </h1>
          <p className="text-lg text-center max-w-md">
            Crea tu cuenta y comienza a disfrutar de todos nuestros servicios con seguridad y confianza.
          </p>
        </div>
      </div>

      {/* Lado derecho con formulario (sin container encajonado) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center rounded-2xl text-white text-3xl shadow-md">
              🚀
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-800">Crear cuenta</h2>
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
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="telefono"
              placeholder="+56912345678"
              value={form.telefono}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepto"
              checked={form.acepto}
              onChange={onChange}
              className="rounded border-gray-300 focus:ring-blue-500"
            />
            Acepto términos y condiciones
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </motion.button>

          <p className="text-sm text-center text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-blue-600 font-medium hover:underline">
              Inicia sesión
            </a>
          </p>
        </motion.form>
      </div>
    </div>
  );
}