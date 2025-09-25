import React, { useState } from "react";
import { registerUser } from "@/services/auth.service";
import { isValidEmail, isValidPhoneCL, isStrongPassword } from "@/utils/validators";

type Form = {
  nombre: string;
  apellido: string;          // 👈 NUEVO
  correo: string;
  telefono: string;
  password: string;
  confirm: string;
  acepto: boolean;
};

const INITIAL: Form = { nombre:"", apellido:"", correo:"", telefono:"", password:"", confirm:"", acepto:false };

export default function RegisterForm() {
  const [form, setForm] = useState<Form>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError("Ingresa tu nombre.");
    if (!form.apellido.trim()) return setError("Ingresa tu apellido.");  // 👈 NUEVO
    if (!isValidEmail(form.correo)) return setError("Correo inválido.");
    if (!isValidPhoneCL(form.telefono)) return setError("Teléfono chileno en formato +569XXXXXXXX.");
    if (!isStrongPassword(form.password)) return setError("La contraseña debe tener 8+ caracteres, mayúscula, minúscula y número.");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");
    if (!form.acepto) return setError("Debes aceptar los términos.");

    try {
      setLoading(true);
      await registerUser({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),              // 👈 NUEVO
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
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input name="nombre" value={form.nombre} onChange={onChange}
                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
        </div>
        <div>
          <label className="block text-sm mb-1">Apellido</label>
          <input name="apellido" value={form.apellido} onChange={onChange}      // 👈 NUEVO
                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Correo</label>
        <input name="correo" type="email" value={form.correo} onChange={onChange}
               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
      </div>

      <div>
        <label className="block text-sm mb-1">Teléfono (+569XXXXXXXX)</label>
        <input name="telefono" value={form.telefono} onChange={onChange} placeholder="+56912345678"
               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input name="password" type="password" value={form.password} onChange={onChange}
                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirmar</label>
          <input name="confirm" type="password" value={form.confirm} onChange={onChange}
                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="acepto" checked={form.acepto} onChange={onChange} />
        Acepto términos y condiciones
      </label>

      <button disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        ¿Ya tienes cuenta? <a className="text-blue-600 hover:underline" href="/login">Inicia sesión</a>
      </p>
    </form>
  );
}
