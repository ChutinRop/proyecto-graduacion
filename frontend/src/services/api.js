// Centraliza todas las llamadas al backend
const API_URL = 'http://localhost:5000/api';

export const api = {
  // AUTH
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
  },

  // PACIENTES
  getPacientes: async () => {
    const res = await fetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error('Error obteniendo pacientes');
    return res.json();
  },

  crearPaciente: async (paciente) => {
    const res = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paciente),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear paciente');
    return data;
  },

  // VISITAS
  crearVisita: async (visita) => {
    const res = await fetch(`${API_URL}/visitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visita),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear visita');
    return data;
  },

  getVisitasHoy: async () => {
    const res = await fetch(`${API_URL}/visitas/hoy`);
    if (!res.ok) throw new Error('Error obteniendo visitas');
    return res.json();
  },

  getVisita: async (id_visita) => {
    const res = await fetch(`${API_URL}/visitas/${id_visita}`);
    if (!res.ok) throw new Error('Error obteniendo visita');
    return res.json();
  },

  getEstadisticas: async () => {
    const res = await fetch(`${API_URL}/visitas/estadisticas`);
    if (!res.ok) throw new Error('Error obteniendo estadísticas');
    return res.json();
  },

  // PRECONSULTA
  registrarPreconsulta: async (data) => {
    const res = await fetch(`${API_URL}/preconsulta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al registrar preconsulta');
    return result;
  },

  getPreconsulta: async (id_visita) => {
    const res = await fetch(`${API_URL}/preconsulta/${id_visita}`);
    if (!res.ok) throw new Error('Error obteniendo preconsulta');
    return res.json();
  },

  // CONSULTA MÉDICA
  registrarConsulta: async (data) => {
    const res = await fetch(`${API_URL}/consulta_medica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al registrar consulta');
    return result;
  },

  getConsulta: async (id_visita) => {
    const res = await fetch(`${API_URL}/consulta_medica/${id_visita}`);
    if (!res.ok) throw new Error('Error obteniendo consulta');
    return res.json();
  },

  // USUARIOS (Control de acceso)
  getUsuarios: async () => {
    const res = await fetch(`${API_URL}/usuarios`);
    if (!res.ok) throw new Error('Error obteniendo usuarios');
    return res.json();
  },

  crearUsuario: async (usuario) => {
    const res = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear usuario');
    return data;
  },

  eliminarUsuario: async (id) => {
    const res = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar usuario');
    return res.json();
  },

  // EXPEDIENTE DE PACIENTE
  getExpediente: async (id_paciente) => {
    const res = await fetch(`${API_URL}/expediente/${id_paciente}`);
    if (!res.ok) throw new Error('Error obteniendo expediente');
    return res.json();
  },
  // ROLES
  getRoles: async () => {
    const res = await fetch(`${API_URL}/roles`);
    if (!res.ok) throw new Error('Error obteniendo roles');
    return res.json();
  },
};
