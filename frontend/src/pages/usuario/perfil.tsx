import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/services/account.service";


export default function PerfilPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"perfil" | "password">("perfil");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (newPassword.length < 8) return setErr("La nueva contraseña debe tener al menos 8 caracteres.");
    if (newPassword !== confirm) return setErr("Las contraseñas no coinciden.");
    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword }); // 👈 ahora pega a /account/change-password
      setMsg("Contraseña actualizada con éxito.");
      setCurrent(""); setNew(""); setConfirm("");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "No se pudo actualizar la contraseña.");
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Mi perfil</h1>

        <div className="border-b mb-6">
          <nav className="-mb-px flex gap-6">
            <button
              className={`pb-3 border-b-2 ${tab === "perfil" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              onClick={() => setTab("perfil")}
            >
              Perfil
            </button>
            <button
              className={`pb-3 border-b-2 ${tab === "password" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              onClick={() => setTab("password")}
            >
              Cambiar contraseña
            </button>
          </nav>
        </div>

        {tab === "perfil" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Información del usuario</h2>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{user.nombre} {user.apellido}</span></div>
                <div><span className="text-gray-500">Correo:</span> <span className="font-medium">{user.correo}</span></div>
                <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{user.telefono}</span></div>
                <div><span className="text-gray-500">Rol:</span> <span className="font-medium">{user.rol}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === "password" && (
          <form onSubmit={savePassword} className="max-w-md bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Cambiar contraseña</h2>
            {msg && <div className="mb-3 text-sm text-green-700 bg-green-50 p-2 rounded">{msg}</div>}
            {err && <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{err}</div>}

            <label className="block text-sm mb-1">Contraseña actual</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 mb-3" value={currentPassword} onChange={e => setCurrent(e.target.value)} />

            <label className="block text-sm mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 mb-3" value={newPassword} onChange={e => setNew(e.target.value)} />

            <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 mb-4" value={confirm} onChange={e => setConfirm(e.target.value)} />

            <button disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-60">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
