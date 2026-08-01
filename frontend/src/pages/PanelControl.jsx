import React, { useState, useEffect } from "react";
import {
  LayoutGrid, UserPlus, FolderOpen, Shield, Plus, Search, Bell, HelpCircle,
  LogOut, Users, Clock, FileText, Calendar, Filter, Download, Eye, Pencil,
  Megaphone, AlertTriangle, Info, History, Loader2,
  Stethoscope, HeartPulse, UserCheck, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const navItems = [
  { label: "Panel de Control", icon: LayoutGrid, path: "/", roles: ["administrador", "director", "medico", "enfermera"] },
  { label: "Registro de Pacientes", icon: UserPlus, path: "/registro", roles: ["administrador", "medico", "enfermera"] },
  { label: "Expedientes Clínicos", icon: FolderOpen, path: "/expedientes", roles: ["administrador", "director", "medico", "enfermera"] },
  { label: "Control de Acceso", icon: Shield, path: "/admin", roles: ["administrador", "director", "medico"] },
];

const roleLabels = {
  enfermera: "Personal de Enfermería",
  medico: "Personal Médico",
  administrador: "Panel Administrativo",
  director: "Dirección Médica",
};

const roleMessages = {
  enfermera: "Triaje y signos vitales: atiende a los pacientes que llegan al centro.",
  medico: "Diagnósticos: revisa a los pacientes en espera y finaliza sus consultas.",
  administrador: "Resumen de operaciones del sistema de pre-consultas para hoy.",
  director: "Supervisión general de las operaciones del centro médico.",
};

const roleStats = {
  enfermera: [
    { label: "Pacientes de Hoy", value: "total_visitas_hoy", sub: "completados", subCount: "completados", icon: Users, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#005eb8]" },
    { label: "Triaje Pendiente", value: "pendientes", valueColor: "text-[#ba1a1a]", sub: "Esperando signos vitales", icon: Clock, iconBg: "bg-[#ffdad6]", borderColor: "border-l-[#ba1a1a]" },
    { label: "En Triaje", value: "en_triaje", valueColor: "text-[#006a71]", sub: "Signos vitales registrados", icon: HeartPulse, iconBg: "bg-[#c7f0f4]", borderColor: "border-l-[#006a71]" },
  ],
  medico: [
    { label: "Pacientes de Hoy", value: "total_visitas_hoy", sub: "atendidos", subCount: "completados", icon: Users, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#005eb8]" },
    { label: "En Espera de Consulta", value: "en_triaje", valueColor: "text-[#006a71]", sub: "Listos para diagnóstico", icon: Stethoscope, iconBg: "bg-[#c7f0f4]", borderColor: "border-l-[#006a71]" },
    { label: "Consultas Completadas", value: "completados", valueColor: "text-[#00478d]", sub: "Pacientes atendidos hoy", icon: UserCheck, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#00478d]" },
  ],
  administrador: [
    { label: "Pacientes de Hoy", value: "total_visitas_hoy", sub: "completados", subCount: "completados", icon: Users, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#005eb8]" },
    { label: "Pendientes", value: "pendientes", valueColor: "text-[#ba1a1a]", sub: "En espera de atención", icon: Clock, iconBg: "bg-[#ffdad6]", borderColor: "border-l-[#ba1a1a]" },
    { label: "En Triaje", value: "en_triaje", valueColor: "text-[#006a71]", sub: "Con signos vitales", icon: HeartPulse, iconBg: "bg-[#c7f0f4]", borderColor: "border-l-[#006a71]" },
    { label: "Completados", value: "completados", valueColor: "text-[#00478d]", sub: "Consultas terminadas", icon: UserCheck, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#00478d]" },
  ],
  director: [
    { label: "Pacientes de Hoy", value: "total_visitas_hoy", sub: "completados", subCount: "completados", icon: Users, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#005eb8]" },
    { label: "Pendientes", value: "pendientes", valueColor: "text-[#ba1a1a]", sub: "En espera de atención", icon: Clock, iconBg: "bg-[#ffdad6]", borderColor: "border-l-[#ba1a1a]" },
    { label: "En Triaje", value: "en_triaje", valueColor: "text-[#006a71]", sub: "Con signos vitales", icon: HeartPulse, iconBg: "bg-[#c7f0f4]", borderColor: "border-l-[#006a71]" },
    { label: "Completados", value: "completados", valueColor: "text-[#00478d]", sub: "Consultas terminadas", icon: UserCheck, iconBg: "bg-[#d0e1fb]", borderColor: "border-l-[#00478d]" },
  ],
};

const statusStyles = {
  completado: "bg-[#d0e1fb] text-[#00478d]",
  pendiente: "bg-[#ffdad6] text-[#ba1a1a]",
  en_triaje: "bg-[#c7f0f4] text-[#006a71]",
};

const statusLabel = {
  completado: "Completado",
  pendiente: "Pendiente",
  en_triaje: "En Triaje",
};

export default function PanelControl() {
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState([]);
  const [stats, setStats] = useState({ total_visitas_hoy: 0, pendientes: 0, en_triaje: 0, completados: 0, ultima_hora: 0 });
  const [loading, setLoading] = useState(true);
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [visitaForm, setVisitaForm] = useState({ id_paciente: "", motivo_consulta: "" });
  const [visitaLoading, setVisitaLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("auth") || "{}");
  const rol = user.rol || "enfermera";
  const filteredNav = navItems.filter((n) => n.roles.includes(rol));
  const puedeCrearVisita = ["enfermera", "administrador", "medico"].includes(rol);
  const statCards = (roleStats[rol] || roleStats.enfermera).map((s) => ({
    ...s,
    value: stats[s.value],
    sub: s.subCount ? `${stats[s.subCount]} ${s.sub}` : s.sub,
  }));

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const fetchData = async () => {
    try {
      const [v, s, p] = await Promise.all([api.getVisitasHoy(), api.getEstadisticas(), api.getPacientes()]);
      setVisitas(v);
      setStats(s);
      setPacientes(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCrearVisita = async (e) => {
    e.preventDefault();
    if (!visitaForm.id_paciente || !user.id) return;
    setVisitaLoading(true);
    try {
      await api.crearVisita({ ...visitaForm, id_paciente: parseInt(visitaForm.id_paciente), id_usuario_registro: user.id });
      setShowVisitaModal(false);
      setVisitaForm({ id_paciente: "", motivo_consulta: "" });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setVisitaLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#191c1e] overflow-hidden">
      <aside className="w-[255px] h-full flex-shrink-0 bg-white border-r border-[#c2c6d4] flex flex-col justify-between">
        <div className="p-4 overflow-y-auto">
          <div className="pb-6">
            <div className="font-bold text-lg text-[#00478d]">CMP Zaculeu</div>
            <div className="text-xs text-[#424752] mt-0.5 capitalize">{roleLabels[rol] || rol}</div>
          </div>
          <nav className="flex flex-col gap-1">
            {filteredNav.map(({ label, icon: Icon, path }) => (
              <div key={label} onClick={() => navigate(path)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md font-semibold text-sm cursor-pointer ${path === "/" ? "bg-[#d0e1fb] text-[#00478d]" : "text-[#424752] hover:bg-[#f2f4f6]"}`}>
                <Icon size={18} />
                {label}
              </div>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-[#c2c6d4] flex flex-col gap-3 shrink-0">
          {puedeCrearVisita && (
            <button onClick={() => { setVisitaForm({ id_paciente: "", motivo_consulta: "" }); setShowVisitaModal(true); }} className="w-full min-h-[48px] bg-[#005eb8] text-white rounded font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#00478d] transition-colors">
              <Plus size={18} /> Nueva Visita
            </button>
          )}
          <div onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-[#424752] hover:bg-[#f2f4f6] rounded-md cursor-pointer transition-colors">
            <LogOut size={16} /> Cerrar Sesión
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-20 shrink-0 bg-white border-b border-[#c2c6d4] flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="font-bold text-[22px] leading-tight text-[#00478d]">
            Centro Médico Público<br />de Zaculeu
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 w-[280px] bg-[#f2f4f6] border border-[#c2c6d4] rounded px-3.5 py-2.5 text-sm text-[#424752]">
              <Search size={16} /> Buscar expediente...
            </div>
            <Bell size={20} className="text-[#424752]" />
            <HelpCircle size={20} className="text-[#424752]" />
            <div className="text-right mr-1">
              <div className="font-bold text-sm text-[#00478d]">{user.nombre || "Usuario"}</div>
              <div className="text-xs text-[#424752] capitalize">{user.rol || "---"}</div>
            </div>
            <div className="w-[38px] h-[38px] rounded-full bg-[#d0e1fb] border border-[#c2c6d4] flex items-center justify-center font-bold text-[#00478d] text-sm">
              {(user.nombre || "U")[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-bold text-[32px]">Panel de Control</h1>
              <div className="text-sm text-[#424752] mt-1">{roleMessages[rol] || roleMessages.enfermera}</div>
            </div>
            <div className="flex items-center gap-2.5 bg-white border border-[#c2c6d4] rounded-md px-4 py-2">
              <div>
                <div className="text-[11px] tracking-wide text-[#424752]">FECHA ACTUAL</div>
                <div className="font-bold">{new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <Calendar size={18} className="text-[#00478d]" />
            </div>
          </div>

          <div className={`grid ${statCards.length > 3 ? "grid-cols-4" : "grid-cols-3"} gap-5 mb-6`}>
            {statCards.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} valueColor={s.valueColor} sub={s.sub} icon={s.icon} iconBg={s.iconBg} borderColor={s.borderColor} />
            ))}
          </div>

          <div className="bg-white border border-[#c2c6d4] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-xl">Lista de Visitas del Día</div>
              {puedeCrearVisita && (
                <button onClick={() => { setVisitaForm({ id_paciente: "", motivo_consulta: "" }); setShowVisitaModal(true); }} className="flex items-center gap-1.5 bg-[#005eb8] text-white rounded px-3.5 py-2 font-semibold text-[13px] hover:bg-[#00478d] transition-colors">
                  <Plus size={14} /> Nueva Visita
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-[#424752]">
                <Loader2 size={28} className="animate-spin mr-3" /> Cargando visitas...
              </div>
            ) : visitas.length === 0 ? (
              <div className="text-center py-16 text-[#727783]">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No hay visitas registradas para hoy</p>
                <p className="text-sm mt-1">Las visitas nuevas aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left">
                    {["NOMBRE DEL PACIENTE", "DPI", "FECHA DE VISITA", "MOTIVO", "ESTADO", "ACCIONES"].map((h) => (
                      <th key={h} className="text-xs tracking-wide text-[#424752] py-2 px-3 border-b border-[#c2c6d4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitas.map((v) => (
                    <tr key={v.id_visita} className="border-b border-[#eceef0] hover:bg-[#f7f9fb]">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#d0e1fb] flex items-center justify-center font-bold text-xs text-[#00478d]">
                            {v.nombre_completo?.split(' ').map(n => n[0]).slice(0,2).join('')}
                          </div>
                          <div>
                            <div className="font-semibold">{v.nombre_completo}</div>
                            <div className="text-xs text-[#424752]">{v.sexo === 'M' ? 'Masculino' : 'Femenino'}, {v.edad} años</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-sm">{v.dpi || '—'}</td>
                      <td className="py-3.5 px-3 text-sm">{new Date(v.fecha_visita).toLocaleString('es-GT')}</td>
                      <td className="py-3.5 px-3 text-sm max-w-[200px] truncate">{v.motivo_consulta || '—'}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[v.estado] || "bg-[#eceef0] text-[#424752]"}`}>
                          {statusLabel[v.estado] || v.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex gap-2">
                          {v.estado === 'pendiente' && ["enfermera", "medico", "administrador", "director"].includes(user.rol) && (
                            <button onClick={() => navigate(`/preconsulta?id_visita=${v.id_visita}`)} className="px-3 py-1.5 bg-[#006a71] hover:bg-[#004d56] text-white text-xs rounded font-semibold transition-colors flex items-center gap-1">
                              <HeartPulse size={12} /> Triaje
                            </button>
                          )}
                          {v.estado === 'en_triaje' && ["medico", "administrador", "director"].includes(user.rol) && (
                            <button onClick={() => navigate(`/consulta?id_visita=${v.id_visita}`)} className="px-3 py-1.5 bg-[#00478d] hover:bg-[#003366] text-white text-xs rounded font-semibold transition-colors flex items-center gap-1">
                              <Stethoscope size={12} /> Consultar
                            </button>
                          )}
                          <button onClick={() => navigate(`/expedientes?id=${v.id_paciente}`)} className="text-[#424752] hover:text-[#005eb8] p-1.5" title="Ver expediente">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nueva Visita */}
      {showVisitaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowVisitaModal(false)} className="absolute top-3 right-3 text-[#424752] hover:bg-[#f2f4f6] p-1.5 rounded-md transition-colors">
              <X size={20} />
            </button>
            <h2 className="font-bold text-xl text-[#00478d] mb-5">Nueva Visita</h2>
            <form onSubmit={handleCrearVisita} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Paciente <span className="text-[#ba1a1a]">*</span></label>
                <select required value={visitaForm.id_paciente} onChange={e => setVisitaForm({...visitaForm, id_paciente: e.target.value})}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all">
                  <option value="">-- Seleccionar paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombre_completo} {p.dpi ? `(${p.dpi})` : ''} - {p.edad} años
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Motivo de Consulta</label>
                <textarea value={visitaForm.motivo_consulta} onChange={e => setVisitaForm({...visitaForm, motivo_consulta: e.target.value})} rows={3}
                  className="w-full border border-[#c2c6d4] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#005eb8] transition-all"
                  placeholder="Ej. Control de hipertensión, dolor abdominal, etc." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowVisitaModal(false)} className="px-5 py-2.5 border border-[#c2c6d4] rounded-lg font-semibold text-[#424752] hover:bg-[#f2f4f6] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={visitaLoading} className="px-5 py-2.5 bg-[#005eb8] hover:bg-[#00478d] text-white rounded-lg font-bold transition-all disabled:opacity-60 flex items-center gap-2">
                  {visitaLoading ? <><Loader2 size={16} className="animate-spin" /> Creando...</> : "Crear Visita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, valueColor = "text-[#191c1e]", sub, icon: Icon, iconBg, borderColor }) {
  return (
    <div className={`bg-white border border-[#c2c6d4] border-l-4 ${borderColor} rounded-lg p-5 flex justify-between items-start`}>
      <div>
        <div className="font-semibold text-sm text-[#424752]">{label}</div>
        <div className={`font-bold text-[32px] mt-1.5 ${valueColor}`}>{value ?? '—'}</div>
        <div className="text-xs text-[#424752] mt-1.5">{sub}</div>
      </div>
      <div className={`w-11 h-11 rounded-md ${iconBg} flex items-center justify-center`}>
        <Icon size={20} className="text-[#00478d]" />
      </div>
    </div>
  );
}
