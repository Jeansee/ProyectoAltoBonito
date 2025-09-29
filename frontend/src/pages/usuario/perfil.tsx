import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { changePassword, updateProfile, fetchMe } from "@/services/auth.service";


export default function PerfilPage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<"perfil" | "password">("perfil");
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  
  // Cargar datos del usuario si es necesario
  useEffect(() => {
    if (!user?.id) {
      const loadUserData = async () => {
        try {
          setIsLoading(true);
          const response = await fetchMe();
          updateUser(response.user, response.token);
        } catch (error) {
          console.error('Error loading user data:', error);
          setErr('Error al cargar los datos del usuario');
        } finally {
          setIsLoading(false);
        }
      };
      loadUserData();
    }
  }, [user?.id, updateUser]);

  // Mantener formData sincronizado con el usuario
  const [formData, setFormData] = useState(() => ({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    telefono: user?.telefono || "",
  }));

  // Actualizar formData cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono,
      });
    }
  }, [user]);

  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); 
    setMsg(null);
    if (newPassword.length < 8) return setErr("La nueva contraseña debe tener al menos 8 caracteres.");
    if (newPassword !== confirm) return setErr("Las contraseñas no coinciden.");
    try {
      setIsLoading(true);
      await changePassword({ currentPassword, newPassword });
      setMsg("Contraseña actualizada con éxito.");
      // Limpiar campos después de éxito
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Información del usuario</h2>
                <button 
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false);
                      setFormData({
                        nombre: user.nombre,
                        apellido: user.apellido,
                        telefono: user.telefono,
                      });
                    } else {
                      setEditMode(true);
                      setFormData({
                        nombre: user.nombre,
                        apellido: user.apellido,
                        telefono: user.telefono,
                      });
                    }
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {editMode ? "Cancelar" : "Editar"}
                </button>
              </div>
              
              {editMode ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setErr(null);
                  setMsg(null);
                  try {
                    setIsLoading(true);
                    const response = await updateProfile(formData);
                    // Actualizar el estado global y local con el nuevo token
                    updateUser(response.user, response.token);
                    setEditMode(false);
                    setMsg("Perfil actualizado con éxito");
                    // Actualizar formData con los nuevos valores
                    setFormData({
                      nombre: response.user.nombre,
                      apellido: response.user.apellido,
                      telefono: response.user.telefono,
                    });
                  } catch (e: any) {
                    setErr(e?.response?.data?.message || "Error al actualizar el perfil");
                  } finally {
                    setIsLoading(false);
                  }
                }} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Apellido</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="!mt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {isLoading ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{user.nombre} {user.apellido}</span></div>
                  <div><span className="text-gray-500">Correo:</span> <span className="font-medium">{user.correo}</span></div>
                  <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{user.telefono}</span></div>
                  <div><span className="text-gray-500">Rol:</span> <span className="font-medium">{user.rol}</span></div>
                </div>
              )}
              {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded">{msg}</div>}
              {err && <div className="mt-3 text-sm text-red-700 bg-red-50 p-2 rounded">{err}</div>}
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

            <button disabled={isLoading} className="w-full bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-60">
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
