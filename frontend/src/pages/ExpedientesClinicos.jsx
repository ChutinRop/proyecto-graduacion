import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutGrid, UserPlus, FolderOpen, Shield, Plus, Search, Bell, HelpCircle,
  LogOut, Download, AlertTriangle, Activity, Pill, History, Calendar,
  FileText, Eye, HeartPulse, Stethoscope, Loader2, Users,
} from "lucide-react";
import { api } from "../services/api";
import { filtrarNav, roles } from "../services/permisos";

const navItems = [
  { label: "Panel de Control", icon: LayoutGrid, path: "/" },
  { label: "Registro de Pacientes", icon: UserPlus, path: "/registro" },
  { label: "Expedientes Clínicos", icon: FolderOpen, path: "/expedientes" },
  { label: "Control de Acceso", icon: Shield, path: "/admin" },
];

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

export default function ExpedientesClinicos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id_paciente = searchParams.get("id");

  const [paciente, setPaciente] = useState(null);
  const [visitas, setVisitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedVisita, setExpandedVisita] = useState(null);

  const user = JSON.parse(localStorage.getItem("auth") || "{}");
  const nav = filtrarNav(user.rol, navItems);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const fetchData = async () => {
    setPaciente(null);
    setVisitas([]);
    setExpandedVisita(null);
    if (!id_paciente) {
      try {
        const p = await api.getPacientes();
        setPacientes(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const exp = await api.getExpediente(id_paciente);
      setPaciente(exp.paciente);
      setVisitas(exp.visitas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id_paciente]);

  const goToPreconsulta = (id_visita) => navigate(`/preconsulta?id_visita=${id_visita}`);
  const goToConsulta = (id_visita) => navigate(`/consulta?id_visita=${id_visita}`);

  const pacientesFiltrados = pacientes.filter((p) => {
    const q = busqueda.trim().toLowerCase();
    return !q
      || (p.nombre_completo || "").toLowerCase().includes(q)
      || (p.dpi || "").includes(q);
  });

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#191c1e] overflow-hidden">
      <aside className="w-[300px] h-full flex-shrink-0 bg-white border-r border-[#c2c6d4] flex flex-col justify-between">
        <div className="p-5 overflow-y-auto">
          <div className="flex items-center gap-3 pb-6">
            <div className="w-11 h-11 rounded-lg bg-[#005eb8] text-white flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <div className="font-bold text-lg text-[#00478d]">Centro Médico</div>
              <div className="text-[11px] tracking-wide text-[#424752]">EXPEDIENTES CLÍNICOS</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map(({ label, icon: Icon, path }) => (
              <div
                key={label}
                onClick={() => navigate(path)}
                className={`flex items-center gap-3 p-3 rounded-md font-semibold text-[15px] cursor-pointer ${
                  path === "/expedientes" ? "bg-[#d0e1fb] text-[#00478d]" : "text-[#424752] hover:bg-[#f2f4f6]"
                }`}
              >
                <Icon size={20} />
                {label}
              </div>
            ))}
          </nav>
        </div>
        <div className="p-5 border-t border-[#c2c6d4] flex flex-col gap-3.5 shrink-0">
          <button onClick={() => navigate("/preconsulta")} className="w-full min-h-[48px] bg-[#005eb8] text-white rounded font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#00478d] transition-colors">
            <Plus size={18} /> Nueva Consulta
          </button>
          <div onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-[#424752] hover:bg-[#f2f4f6] rounded-md cursor-pointer transition-colors">
            <LogOut size={16} /> Cerrar Sesión
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-[74px] shrink-0 bg-white border-b border-[#c2c6d4] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 max-w-[500px] w-full text-sm text-[#424752]">
            <Search size={16} /> Buscar paciente o expediente...
          </div>
          <div className="flex items-center gap-5">
            <Bell size={20} className="text-[#424752]" />
            <HelpCircle size={20} className="text-[#424752]" />
            <div className="text-right">
              <div className="font-bold text-sm text-[#00478d]">{user.nombre || "Usuario"}</div>
              <div className="text-xs text-[#424752] capitalize">{user.rol || "---"}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#d0e1fb] border border-[#c2c6d4]" />
          </div>
        </header>

        <main className="flex-1 p-10 max-w-[1160px] overflow-auto h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#424752]">
              <Loader2 size={32} className="animate-spin text-[#005eb8]" />
            </div>
          ) : !id_paciente ? (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="font-bold text-[26px]">Expedientes Clínicos</h1>
                  <p className="text-sm text-[#424752] mt-1">Selecciona un paciente para ver su historial clínico.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#c2c6d4] rounded-md px-4 py-2.5 text-sm text-[#424752]">
                  <Search size={16} />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o DPI..."
                    className="outline-none bg-transparent w-64"
                  />
                </div>
              </div>
              <div className="bg-white border border-[#c2c6d4] rounded-xl overflow-hidden shadow-sm">
                {pacientesFiltrados.length === 0 ? (
                  <div className="text-center py-16 text-[#727783]">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No se encontraron pacientes</p>
                    <p className="text-sm mt-1">Registra pacientes nuevos desde la opción "Registro de Pacientes".</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-[#f2f4f6] border-b border-[#c2c6d4]">
                      <tr>
                        {["PACIENTE", "DPI", "EDAD", "GÉNERO", "REGISTRADO"].map((h) => (
                          <th key={h} className="px-6 py-4 font-semibold text-sm text-[#424752]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eceef0]">
                      {pacientesFiltrados.map((p) => (
                        <tr key={p.id_paciente} onClick={() => navigate(`/expedientes?id=${p.id_paciente}`)} className="cursor-pointer hover:bg-[#f7f9fb] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center font-bold text-sm text-[#005eb8]">
                                {p.nombre_completo.split(" ").map(n => n[0]).slice(0, 2).join("")}
                              </div>
                              <span className="font-semibold">{p.nombre_completo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-[#424752]">{p.dpi || "—"}</td>
                          <td className="px-6 py-4 text-sm">{p.edad || "—"} años</td>
                          <td className="px-6 py-4 text-sm">{p.sexo === "M" ? "Masculino" : "Femenino"}</td>
                          <td className="px-6 py-4 text-sm text-[#424752]">{new Date(p.fecha_registro).toLocaleDateString("es-GT")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : !paciente ? (
            <div className="flex items-center justify-center h-full text-[#ba1a1a]">Paciente no encontrado</div>
          ) : (
          <>
          <div className="bg-white border border-[#c2c6d4] border-l-4 border-l-[#005eb8] rounded-lg p-6 flex items-center gap-6 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#d0e1fb] flex items-center justify-center text-2xl">🧑</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="font-bold text-[26px]">{paciente.nombre_completo}</div>
                <span className="bg-[#d0e1fb] text-[#00478d] text-xs font-semibold px-3 py-1 rounded-full">
                  Paciente Activo
                </span>
              </div>
              <div className="flex gap-8 mt-2">
                {[
                  ["DPI / ID", paciente.dpi || "—"],
                  ["EDAD", `${paciente.edad || "—"} años`],
                  ["GÉNERO", paciente.sexo === "M" ? "Masculino" : "Femenino"],
                  ["ÚLTIMA VISITA", visitas[0] ? new Date(visitas[0].fecha_visita).toLocaleDateString("es-GT") : "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-[11px] tracking-wide text-[#424752]">{label}</div>
                    <div className="font-bold mt-0.5">{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-auto flex gap-3">
              <button className="flex items-center gap-1.5 border border-[#c2c6d4] bg-white rounded px-4 py-3 font-semibold text-sm whitespace-nowrap">
                <Download size={16} /> Descargar Historial
              </button>
              <button onClick={() => navigate(`/preconsulta?id_paciente=${paciente.id_paciente}`)} className="bg-[#005eb8] text-white rounded font-semibold text-sm whitespace-nowrap px-5 py-3">
                Nueva Consulta
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5 mb-5">
            <InfoCard
              bg="bg-[#ffdad6]"
              titleColor="text-[#ba1a1a]"
              icon={AlertTriangle}
              title="ALERGIAS"
              items={paciente.alergias ? paciente.alergias.split(",").map(a => a.trim()) : ["Sin registro"]}
            />
            <InfoCard
              bg="bg-[#dceeee]"
              titleColor="text-[#006a71]"
              icon={Activity}
              title="ENFERMEDADES CRÓNICAS"
              items={paciente.enfermedades_cronicas ? paciente.enfermedades_cronicas.split(",").map(a => a.trim()) : ["Sin registro"]}
            />
            <InfoCard
              bg="bg-[#d0e1fb]"
              titleColor="text-[#00478d]"
              icon={Pill}
              title="MEDICAMENTOS ACTUALES"
              items={paciente.medicamentos_actuales ? paciente.medicamentos_actuales.split(",").map(a => a.trim()) : ["Sin registro"]}
            />
          </div>

          <div className="bg-white border border-[#c2c6d4] rounded-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5 font-bold text-xl">
                <History size={20} /> Historial de Visitas
              </div>
              <span className="text-sm text-[#424752]">{visitas.length} registro(s)</span>
            </div>

            <div className="flex flex-col gap-4">
              {visitas.map((v) => {
                const hasPreconsulta = v.presion_sistolica || v.temperatura || v.peso;
                const hasConsulta = v.diagnostico || v.indicaciones;
                return (
                  <div key={v.id_visita} className="border border-[#eceef0] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedVisita(expandedVisita === v.id_visita ? null : v.id_visita)}
                      className="w-full px-5 py-4 flex items-center justify-between bg-[#fafbfc] hover:bg-[#f2f4f6] transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.estado === "completado" ? "bg-[#d0e1fb]" : v.estado === "en_triaje" ? "bg-[#c7f0f4]" : "bg-[#ffdad6]"}`}>
                          <Calendar size={18} className={v.estado === "completado" ? "text-[#00478d]" : v.estado === "en_triaje" ? "text-[#006a71]" : "text-[#ba1a1a]"} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="font-bold text-[17px]">{v.motivo_consulta || "Consulta general"}</div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded whitespace-nowrap ${statusStyles[v.estado] || "bg-[#eceef0] text-[#424752]"}`}>
                              {statusLabel[v.estado] || v.estado}
                            </span>
                          </div>
                          <div className="text-xs text-[#424752] mt-0.5">
                            {new Date(v.fecha_visita).toLocaleString("es-GT")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasPreconsulta && (
                          <span className="flex items-center gap-1 text-xs text-[#006a71] font-medium">
                            <HeartPulse size={12} /> Signos vitales
                          </span>
                        )}
                        {hasConsulta && (
                          <span className="flex items-center gap-1 text-xs text-[#00478d] font-medium">
                            <Stethoscope size={12} /> Diagnóstico
                          </span>
                        )}
                        <span className="text-[#424752]">
                          {expandedVisita === v.id_visita ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {expandedVisita === v.id_visita && (
                      <div className="px-5 pb-5 border-t border-[#eceef0] bg-white animate-slide-down">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {hasPreconsulta && (
                            <div className="bg-[#f0fdf4] border border-[#86efac] rounded-lg p-5">
                              <div className="flex items-center gap-2 text-[#166534] font-semibold mb-4">
                                <HeartPulse size={18} /> Signos Vitales (Preconsulta)
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <VitalDisplay label="Presión" value={`${v.presion_sistolica || "—"}/${v.presion_diastolica || "—"}`} unit="mmHg" />
                                <VitalDisplay label="FC" value={v.frecuencia_cardiaca || "—"} unit="lpm" />
                                <VitalDisplay label="Temperatura" value={v.temperatura || "—"} unit="°C" />
                                <VitalDisplay label="SpO₂" value={v.saturacion_oxigeno || "—"} unit="%" />
                                <VitalDisplay label="Peso" value={v.peso || "—"} unit="kg" />
                                <VitalDisplay label="IMC" value={v.imc || "—"} unit="" />
                              </div>
                              {v.alerta_signos && (
                                <div className="mt-3 p-2 bg-[#fef2f2] border border-[#fecaca] rounded text-sm text-[#991b1b]">
                                  <AlertTriangle size={14} className="inline-block mr-1" />
                                  <strong>Alerta:</strong> {v.detalle_alerta}
                                </div>
                              )}
                            </div>
                          )}
                          {hasConsulta && (
                            <div className="bg-[#eff6ff] border border-[#93c5fd] rounded-lg p-5">
                              <div className="flex items-center gap-2 text-[#1e40af] font-semibold mb-4">
                                <Stethoscope size={18} /> Consulta Médica
                              </div>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <div className="text-[11px] tracking-wide text-[#1e40af] mb-1">DIAGNÓSTICO</div>
                                  <p className="font-medium">{v.diagnostico || "—"}</p>
                                </div>
                                <div>
                                  <div className="text-[11px] tracking-wide text-[#1e40af] mb-1">INDICACIONES</div>
                                  <p className="font-medium">{v.indicaciones || "—"}</p>
                                </div>
                                {v.observaciones && (
                                  <div>
                                    <div className="text-[11px] tracking-wide text-[#1e40af] mb-1">OBSERVACIONES</div>
                                    <p className="font-medium">{v.observaciones}</p>
                                  </div>
                                )}
                                {v.fecha_seguimiento && (
                                  <div className="flex items-center gap-2 text-xs text-[#1e40af]">
                                    <Calendar size={12} /> Seguimiento: {new Date(v.fecha_seguimiento).toLocaleDateString("es-GT")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-[#eceef0]">
                          {v.estado === "pendiente" && roles.triaje.includes(user.rol) && (
                            <button onClick={() => goToPreconsulta(v.id_visita)} className="flex-1 bg-[#006a71] hover:bg-[#004d56] text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
                              <HeartPulse size={16} /> Ir a Triaje
                            </button>
                          )}
                          {v.estado === "en_triaje" && roles.consulta.includes(user.rol) && (
                            <button onClick={() => goToConsulta(v.id_visita)} className="flex-1 bg-[#00478d] hover:bg-[#003366] text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
                              <Stethoscope size={16} /> Ir a Consulta
                            </button>
                          )}
                          <button onClick={() => goToPreconsulta(v.id_visita)} className="flex-1 border border-[#c2c6d4] bg-white text-[#424752] py-2.5 rounded-lg font-semibold hover:bg-[#f2f4f6]">
                            Ver Preconsulta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {visitas.length === 0 && (
              <div className="text-center py-16 text-[#727783]">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No hay visitas registradas</p>
                <p className="text-sm mt-1">Este paciente aún no tiene historial en el sistema.</p>
              </div>
            )}
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoCard({ bg, titleColor, icon: Icon, title, items }) {
  return (
    <div className={`${bg} rounded-lg flex gap-3.5 p-5`}>
      <Icon size={20} className={titleColor} />
      <div>
        <div className={`font-bold text-xs tracking-wide mb-2 ${titleColor}`}>{title}</div>
        <ul className="text-sm">
          {items.map((i) => (
            <li key={i} className="font-bold mt-0.5">{i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VitalDisplay({ label, value, unit }) {
  return (
    <div className="bg-white border border-[#bbf7d0] rounded-md px-3 py-2">
      <div className="text-[10px] tracking-wide text-[#166534]">{label}</div>
      <div className="font-bold mt-0.5">{value} <span className="text-xs font-normal text-[#166534]">{unit}</span></div>
    </div>
  );
}