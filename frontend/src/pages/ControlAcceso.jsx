import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Shield, Plus, Trash2, LayoutGrid, UserPlus, FolderOpen, LogOut, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { filtrarNav } from "../services/permisos";

const navItems = [
  { label: "Panel de Control", icon: LayoutGrid, path: "/" },
  { label: "Registro de Pacientes", icon: UserPlus, path: "/registro" },
  { label: "Expedientes Clínicos", icon: FolderOpen, path: "/expedientes" },
  { label: "Control de Acceso", icon: Shield, path: "/admin" },
];

const rolBadge = {
  administrador: "bg-[#ffdad6] text-[#ba1a1a]",
  director: "bg-[#d0e1fb] text-[#00478d]",
  medico: "bg-[#dceeee] text-[#006a71]",
  enfermera: "bg-[#f2f4f6] text-[#424752]",
};

export default function ControlAcceso() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [form, setForm] = useState({ nombre_completo: "", nombre_usuario: "", contrasena: "", id_rol: "" });

  const user = JSON.parse(localStorage.getItem("auth") || "{}");
  const nav = filtrarNav(user.rol, navItems);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const fetchData = async () => {
    try {
      const [u, r] = await Promise.all([api.getUsuarios(), api.getRoles()]);
      setUsuarios(u);
      setRoles(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      await api.crearUsuario(form);
      setFeedback({ type: "ok", msg: `Usuario "${form.nombre_usuario}" creado correctamente.` });
      setShowModal(false);
      setForm({ nombre_completo: "", nombre_usuario: "", contrasena: "", id_rol: "" });
      fetchData();
    } catch (err) {
      setFeedback({ type: "err", msg: err.message });
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"?`)) return;
    try {
      await api.eliminarUsuario(id);
      setFeedback({ type: "ok", msg: `Usuario "${nombre}" desactivado.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: "err", msg: err.message });
    }
  };

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#191c1e] overflow-hidden">
      <aside className="w-[255px] h-full flex-shrink-0 bg-white border-r border-[#c2c6d4] flex flex-col justify-between">
        <div className="p-4 overflow-y-auto">
          <div className="pb-6">
            <div className="font-bold text-lg text-[#00478d]">CMP Zaculeu</div>
            <div className="text-xs text-[#424752] mt-0.5">Panel Administrativo</div>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map(({ label, icon: Icon, path }) => (
              <div key={label} onClick={() => navigate(path)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md font-semibold text-sm cursor-pointer ${path === "/admin" ? "bg-[#d0e1fb] text-[#00478d]" : "text-[#424752] hover:bg-[#f2f4f6]"}`}>
                <Icon size={18} />
                {label}
              </div>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-[#c2c6d4] flex flex-col gap-3 shrink-0">
          <div onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-[#424752] hover:bg-[#f2f4f6] rounded-md cursor-pointer transition-colors">
            <LogOut size={16} /> Cerrar Sesión
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-20 shrink-0 bg-white border-b border-[#c2c6d4] flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="font-bold text-[22px] text-[#00478d]">Administración de Usuarios</div>
          <div className="w-[38px] h-[38px] rounded-full bg-[#d0e1fb] border border-[#c2c6d4] flex items-center justify-center font-bold text-[#00478d]">A</div>
        </header>

        <main className="flex-1 p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-bold text-3xl">Control de Acceso</h1>
              <p className="text-[#424752] mt-1">Gestiona el personal con acceso al sistema.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#005eb8] hover:bg-[#00478d] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors">
              <Plus size={18} /> Nuevo Usuario
            </button>
          </div>

          {feedback.msg && (
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 font-semibold border-l-4 ${feedback.type === "ok" ? "bg-[#dceeee] text-[#006a71] border-[#006a71]" : "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]"}`}>
              {feedback.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {feedback.msg}
            </div>
          )}

          <div className="bg-white border border-[#c2c6d4] rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-[#424752]">
                <Loader2 size={28} className="animate-spin mr-3" /> Cargando usuarios...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f2f4f6] border-b border-[#c2c6d4]">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">PERSONAL</th>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">ROL</th>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">USUARIO</th>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">ESTADO</th>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">ÚLTIMO ACCESO</th>
                    <th className="px-6 py-4 font-semibold text-sm text-[#424752]">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {usuarios.map((u) => (
                    <tr key={u.id_usuario} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center font-bold text-sm text-[#005eb8]">
                            {u.nombre_completo.split(' ').map(n => n[0]).slice(0,2).join('')}
                          </div>
                          <span className="font-semibold">{u.nombre_completo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${rolBadge[u.nombre_rol] || "bg-[#eceef0] text-[#424752]"}`}>
                          {u.nombre_rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-[#424752]">{u.nombre_usuario}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 font-semibold text-sm ${u.activo ? "text-[#006a71]" : "text-[#ba1a1a]"}`}>
                          <div className={`w-2 h-2 rounded-full ${u.activo ? "bg-[#006a71]" : "bg-[#ba1a1a]"}`}></div>
                          {u.activo ? "Activo" : "Inactivo"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#424752]">
                        {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-GT') : "Nunca"}
                      </td>
                      <td className="px-6 py-4">
                        {u.activo ? (
                          <button onClick={() => handleEliminar(u.id_usuario, u.nombre_completo)} className="text-[#ba1a1a] p-2 hover:bg-[#ffdad6] rounded-md transition-colors">
                            <Trash2 size={18} />
                          </button>
                        ) : <span className="text-xs text-[#727783]">Desactivado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nuevo Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#424752] hover:bg-[#f2f4f6] p-1.5 rounded-md transition-colors">
              <X size={20} />
            </button>
            <h2 className="font-bold text-xl text-[#00478d] mb-6">Crear Nuevo Usuario</h2>
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                <input required value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all" placeholder="Dr. Nombre Apellido" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre de Usuario</label>
                <input required value={form.nombre_usuario} onChange={e => setForm({...form, nombre_usuario: e.target.value})}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all" placeholder="Ej. nuevo.doc" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Contraseña</label>
                <input required type="password" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all" placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Rol</label>
                <select required value={form.id_rol} onChange={e => setForm({...form, id_rol: e.target.value})}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all">
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#c2c6d4] rounded-lg font-semibold text-[#424752] hover:bg-[#f2f4f6] transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-[#005eb8] hover:bg-[#00478d] text-white rounded-lg font-bold transition-all">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
