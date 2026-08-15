# Sistema de Pre-Consultas y Expedientes Clínicos — CMP Zaculeu

Sistema web para la gestión clínica y farmacéutica del **Centro Médico Público de Zaculeu**.
Es el proyecto de graduación de la Universidad Mariano Gálvez (PG I · 2026).

Permite registrar pacientes, tomar signos vitales, llevar expedientes clínicos, generar
notas de consulta e historial en PDF, y administrar el inventario de medicamentos con
control de lotes y movimientos.

---

## Tecnologías

| Capa      | Tecnología                              |
|-----------|------------------------------------------|
| Frontend  | React 19 + Vite + Tailwind CSS + lucide-react + jsPDF |
| Backend   | Node.js + Express 5                       |
| Base de datos | PostgreSQL 16 (pg)                     |
| Seguridad | bcrypt para contraseñas, bitácora de auditoría |

## Estructura del proyecto

```
backend/
  server.js        # API REST (Express)
  schema.sql       # Esquema e inserción inicial de la base de datos
  config/db.js     # Conexión a PostgreSQL
  .env             # Credenciales de la base de datos (no se sube al repo)
frontend/
  src/pages/       # Pantallas de la aplicación
  src/services/api.js      # Llamadas centralizadas al backend
  src/services/permisos.js # Matriz de permisos por rol
```

## Roles del sistema

| Rol           | Descripción                                                              |
|---------------|--------------------------------------------------------------------------|
| administrador | Acceso total: usuarios, bitácora, inventario, expedientes, borrado       |
| director      | Reportes, supervisión general e inventario                               |
| medico        | Preconsulta, consulta, diagnóstico, prescripciones y expedientes         |
| enfermera     | Registro de pacientes, signos vitales y preconsulta                      |

## Funcionalidades

**Atención al paciente**
- Registro de pacientes con DPI, datos personales y antecedentes.
- Visitas y cola del día en el panel de control.
- Triaje/preconsulta: presión arterial, peso, talla, IMC y alertas automáticas.
- Consulta médica: diagnóstico, indicaciones, prescripciones y seguimiento.

**Expedientes clínicos**
- Historial completo por paciente (visitas, preconsultas y consultas).
- Descarga de la **nota de consulta en PDF tamaño receta**.
- Descarga del **historial clínico completo en PDF (A4, multipágina)**.
- Eliminación segura de expedientes con modal de confirmación (solo admin/director).

**Inventario de farmacia**
- Catálogo de medicamentos con categorías, presentación y stock mínimo.
- Control de **lotes**: fecha de ingreso, vencimiento individual, cantidad y precio.
- Alerta de stock bajo y productos próximos a vencer (90 días).
- **Ver Lotes** por medicamento: muestra cada lote con su estado (Vigente / Vence en X días / Vencido).
- Editar y eliminar medicamentos y lotes con confirmación; los lotes con
  dispensaciones a pacientes no se pueden borrar (protección de trazabilidad).
- Kardex de movimientos de inventario (entradas, salidas, ajustes, mermas).

**Administración**
- Control de acceso: crear, editar y desactivar usuarios con roles.
- Bitácora de auditoría de todas las acciones importantes.
- Inicio de sesión con contraseñas cifradas (bcrypt).

## Requisitos

- Node.js 18+
- PostgreSQL 16 (puerto 5432)

## Configuración

1. Crear la base de datos y aplicar el esquema:

   ```bash
   psql -U postgres -h localhost -d postgres -c "CREATE DATABASE zaculeu_db;"
   psql -U postgres -h localhost -d zaculeu_db -f backend/schema.sql
   ```

2. Configurar `backend/.env`:

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=zaculeu_db
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   ```

## Ejecución

Backend (puerto 5000):

```bash
cd backend
npm install
npm start
```

Frontend (puerto 5173):

```bash
cd frontend
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

## Credenciales de demostración

| Usuario | Contraseña  | Rol           |
|---------|-------------|---------------|
| admin   | Admin123!   | administrador |
| DOC     | Doctor1234  | medico        |
| Enfer   | Enfer1234   | enfermera     |

> En producción, reemplazar las credenciales temporales del endpoint de login
> (`backend/server.js`) por validación real contra el hash bcrypt.

## Scripts de frontend

| Comando        | Descripción                      |
|----------------|----------------------------------|
| `npm run dev`  | Servidor de desarrollo (Vite)    |
| `npm run build`| Compila la aplicación de producción |
| `npm run lint` | Análisis estático de código      |
```
