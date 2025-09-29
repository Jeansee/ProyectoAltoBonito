import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { changePassword, updateProfile, fetchMe } from "@/services/auth.service";

export default function PerfilPage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<"perfil" | "password">("perfil");
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      const loadUserData = async () => {
        try {
          setIsLoading(true);
          const response = await fetchMe();
          updateUser(response.user, response.token);
        } catch (error) {
          console.error("Error loading user data:", error);
          setErr("Error al cargar los datos del usuario");
        } finally {
          setIsLoading(false);
        }
      };
      loadUserData();
    }
  }, [user?.id, updateUser]);

  const [formData, setFormData] = useState(() => ({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    telefono: user?.telefono || "",
  }));

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
    <div className="min-h-screen bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero con animación */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-28 h-28 rounded-full bg-[#ffb26a]/25 flex items-center justify-center text-[#c14421] text-3xl font-bold shadow-inner"
          >
            {user.nombre?.[0] || "U"}
          </motion.div>
          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-800">
            {user.nombre} {user.apellido}
          </h1>
          <p className="text-gray-500">{user.correo}</p>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 inline-block px-3 py-1 rounded-full bg-[#ffb26a]/30 text-[#c14421] text-sm shadow-sm"
          >
            {user.rol}
          </motion.span>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <motion.nav layout className="flex space-x-2 bg-white rounded-xl shadow p-1">
            <button
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === "perfil"
                  ? "bg-[#c14421] text-white shadow"
                  : "text-gray-700 hover:bg-[#ffb26a]/20"
              }`}
              onClick={() => setTab("perfil")}
            >
              Perfil
            </button>
            <button
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === "password"
                  ? "bg-[#c14421] text-white shadow"
                  : "text-gray-700 hover:bg-[#ffb26a]/20"
              }`}
              onClick={() => setTab("password")}
            >
              Cambiar contraseña
            </button>
          </motion.nav>
        </div>

        {/* Contenido con transiciones */}
        <AnimatePresence mode="wait">
          {tab === "perfil" && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto hover:shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Información del usuario
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
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
                    }
                  }}
                  className="text-sm px-4 py-1.5 rounded-lg bg-[#c14421] text-white hover:bg-[#1e1e1e] shadow-sm"
                >
                  {editMode ? "Cancelar" : "Editar"}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {editMode ? (
                  <motion.form
                    key="edit-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setErr(null);
                      setMsg(null);
                      try {
                        setIsLoading(true);
                        const response = await updateProfile(formData);
                        updateUser(response.user, response.token);
                        setEditMode(false);
                        setMsg("Perfil actualizado con éxito");
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
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={formData.apellido}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, apellido: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#c14421] text-white rounded-lg py-2 font-medium hover:bg-[#1e1e1e] disabled:opacity-60 shadow"
                      >
                        {isLoading ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="view-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nombre:</span>
                      <span className="font-medium">
                        {user.nombre} {user.apellido}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Correo:</span>
                      <span className="font-medium">{user.correo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teléfono:</span>
                      <span className="font-medium">{user.telefono}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rol:</span>
                      <span className="font-medium">{user.rol}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {msg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-5 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg"
                >
                  {msg}
                </motion.div>
              )}
              {err && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg"
                >
                  {err}
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === "password" && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              onSubmit={savePassword}
              className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-5 hover:shadow-xl"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Cambiar contraseña
              </h2>

              {msg && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
                  {msg}
                </div>
              )}
              {err && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
                  {err}
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">Contraseña actual</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                  value={newPassword}
                  onChange={(e) => setNew(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#ffb26a] outline-none"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                className="w-full bg-[#c14421] text-white rounded-lg py-2 font-medium hover:bg-[#1e1e1e] disabled:opacity-60 shadow"
              >
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
