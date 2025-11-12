// src/pages/usuario/perfil.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { changePassword, updateProfile, fetchMe } from "@/services/auth.service";
import GoogleCalendarConnect from "@/components/google/GoogleCalendarConnect";
import { Link } from "react-router-dom";
import MisReservas from "@/components/reserva/misreservas";

type PerfilTab = "perfil" | "password" | "reservas";

export default function Perfil({ initialTab }: { initialTab?: PerfilTab } = {}) {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<PerfilTab>(initialTab || "perfil");
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
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Layout: sidebar izquierda + contenido derecha */}
        <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8">
          {/* Sidebar izquierda */}
          <aside className="bg-white rounded-2xl shadow p-6 flex flex-col items-center min-h-[420px] sm:min-h-[500px] md:min-h-[700px]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 rounded-full bg-[#ffb26a]/25 flex items-center justify-center text-[#c14421] text-3xl font-bold shadow-inner"
            >
              {user.nombre?.[0] || "U"}
            </motion.div>

            <div className="mt-4 text-center">
              <h1 className="text-xl font-bold text-[#1e1e1e]">
                {user.nombre} {user.apellido}
              </h1>
              <p className="text-gray-500 text-sm">{user.correo}</p>
            </div>

            <div className="w-24 h-px bg-[#1e1e1e]/30 my-4" />

            {/* Botones verticales */}
            <nav className="w-full flex flex-col gap-3 mt-2">
              <button
                className={`w-full px-4 py-2 rounded-full text-sm font-medium transition
                  ${tab === "perfil"
                    ? "bg-[#c14421] text-white shadow"
                    : "bg-white border border-gray-200 text-[#1e1e1e] hover:bg-[#ffb26a]/20"}`}
                onClick={() => setTab("perfil")}
              >
                Perfil
              </button>

              {/* Solo CLIENTE ve Mis reservas */}
              {user?.rol === "CLIENTE" && (
                <button
                  className={`w-full px-4 py-2 rounded-full text-sm font-medium transition
                    ${tab === "reservas"
                      ? "bg-[#c14421] text-white shadow"
                      : "bg-white border border-gray-200 text-[#1e1e1e] hover:bg-[#ffb26a]/20"}`}
                  onClick={() => setTab("reservas")}
                >
                  Mis reservas
                </button>
              )}

              <button
                className={`w-full px-4 py-2 rounded-full text-sm font-medium transition
                  ${tab === "password"
                    ? "bg-[#c14421] text-white shadow"
                    : "bg-white border border-gray-200 text-[#1e1e1e] hover:bg-[#ffb26a]/20"}`}
                onClick={() => setTab("password")}
              >
                Cambiar contraseña
              </button>

              {/* Admin mantiene su panel */}
              {user?.rol === "ADMIN" && (
                <Link
                  to="/admin"
                  className="w-full px-4 py-2 rounded-full text-sm font-medium transition
                             bg-white border border-gray-200 text-[#1e1e1e] hover:bg-[#ffb26a]/20
                             flex items-center justify-center"
                >
                  Panel
                </Link>
              )}
            </nav>
          </aside>

          {/* Contenedor derecho */}
          <section className="flex items-start justify-center min-h-[600px] sm:minh-[650px] md:min-h-[720px]">
            <AnimatePresence mode="wait">
              {tab === "perfil" && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="relative w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-gray-100"
                >
                  {/* Barra de acento superior */}
                  <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#ffb26a] via-[#c14421] to-[#ffb26a]" />

                  <div className="p-6 md:p-10 pt-10">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-semibold text-[#1e1e1e]">
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
                        className="text-sm px-4 py-2 rounded-full bg-[#c14421] text-white hover:bg-[#1e1e1e] shadow-sm"
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
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                              <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                                className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500 mb-1">Apellido</label>
                              <input
                                type="text"
                                value={formData.apellido}
                                onChange={(e) => setFormData((prev) => ({ ...prev, apellido: e.target.value }))}
                                className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-500 mb-1">Teléfono</label>
                              <input
                                type="text"
                                value={formData.telefono}
                                onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                                className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                              />
                            </div>
                          </div>

                          {msg && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg"
                            >
                              {msg}
                            </motion.div>
                          )}
                          {err && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg"
                            >
                              {err}
                            </motion.div>
                          )}

                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-5 bg-[#c14421] text-white rounded-full py-2 font-medium hover:bg-[#1e1e1e] disabled:opacity-60 shadow"
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
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                        >
                          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <span className="text-gray-500">Nombre</span>
                            <span className="font-medium">{user.nombre} {user.apellido}</span>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <span className="text-gray-500">Correo</span>
                            <span className="font-medium break-all">{user.correo}</span>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <span className="text-gray-500">Teléfono</span>
                            <span className="font-medium">{user.telefono}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ⬇️ WIDGET DE GOOGLE CALENDAR */}
                    <div className="mt-8">
                      <GoogleCalendarConnect />
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "reservas" && user?.rol === "CLIENTE" && (
                <motion.div
                  key="reservas"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="relative w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-gray-100"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#ffb26a] via-[#c14421] to-[#ffb26a]" />
                  <div className="p-6 md:p-10 pt-10">
                    <h2 className="text-xl md:text-2xl font-semibold text-[#1e1e1e] mb-4">
                      Mis reservas
                    </h2>
                    <React.Suspense fallback={<div className="text-sm text-gray-600">Cargando…</div>}>
                      <MisReservas />
                    </React.Suspense>
                  </div>
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
                  className="relative w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 p-6 md:p-10 pt-10 space-y-5"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#ffb26a] via-[#c14421] to-[#ffb26a]" />

                  <h2 className="text-xl md:text-2xl font-semibold text-[#1e1e1e] mb-2">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">Contraseña actual</label>
                      <input
                        type="password"
                        className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                        value={currentPassword}
                        onChange={(e) => setCurrent(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Nueva contraseña</label>
                      <input
                        type="password"
                        className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                        value={newPassword}
                        onChange={(e) => setNew(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        className="w-full border rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#c14421] outline-none"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={isLoading}
                      className="px-5 bg-[#c14421] text-white rounded-full py-2 font-medium hover:bg-[#1e1e1e] disabled:opacity-60 shadow"
                    >
                      {isLoading ? "Guardando..." : "Guardar cambios"}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}
