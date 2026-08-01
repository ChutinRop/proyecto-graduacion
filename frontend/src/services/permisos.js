// Matriz de permisos por rol del sistema
export const roles = {
  admin: ["administrador", "director", "medico"],
  registro: ["administrador", "medico", "enfermera"],
  expedientes: ["administrador", "director", "medico", "enfermera"],
  triaje: ["administrador", "director", "medico", "enfermera"],
  consulta: ["administrador", "director", "medico"],
  crearVisita: ["administrador", "medico", "enfermera"],
};

// Filtra los ítems del menú lateral según el rol del usuario
export const filtrarNav = (rol, items) =>
  items.filter((item) => {
    if (item.path === "/admin") return roles.admin.includes(rol);
    if (item.path === "/registro") return roles.registro.includes(rol);
    return true;
  });
