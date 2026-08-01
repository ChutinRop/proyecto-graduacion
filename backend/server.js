const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = require('./config/db');

// ============================================================
// AUTH
// ============================================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_rol
             FROM usuario u
             INNER JOIN rol r ON u.id_rol = r.id_rol
             WHERE u.nombre_usuario = $1 AND u.activo = TRUE`,
            [username]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }
        const user = rows[0];

        // Credenciales temporales (reemplazar con bcrypt en producción)
        const credenciales = {
            'DOC':   'Doctor1234',
            'Enfer': 'Enfer1234',
            'admin': 'Admin123!',
        };

        if (!credenciales[username] || credenciales[username] !== password) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        await pool.query('UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = $1', [user.id_usuario]);

        await pool.query(
            `INSERT INTO bitacora (id_usuario, accion, descripcion, ip_equipo)
             VALUES ($1, 'LOGIN', $2, $3)`,
            [user.id_usuario, `Inicio de sesión: ${user.nombre_completo}`, req.ip]
        );

        res.json({
            message: 'Login exitoso',
            user: {
                id:       user.id_usuario,
                username: user.nombre_usuario,
                rol:      user.nombre_rol,
                nombre:   user.nombre_completo,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================================
// VISITAS / DASHBOARD
// ============================================================
app.get('/api/visitas/hoy', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              v.id_visita,
              v.estado,
              v.fecha_visita,
              v.motivo_consulta,
              p.id_paciente,
              p.nombre_completo,
              p.dpi,
              DATE_PART('year', AGE(p.fecha_nacimiento))::INT AS edad,
              p.sexo,
              CONCAT(pr.presion_sistolica, '/', pr.presion_diastolica) AS presion,
              pr.peso,
              pr.temperatura
            FROM visita v
            INNER JOIN paciente p ON v.id_paciente = p.id_paciente
            LEFT JOIN preconsulta pr ON v.id_visita = pr.id_visita
            WHERE v.fecha_visita::DATE = CURRENT_DATE
            ORDER BY v.fecha_visita DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo visitas de hoy' });
    }
});

app.get('/api/visitas/estadisticas', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              COUNT(DISTINCT v.id_visita)                                                               AS total_visitas_hoy,
              COUNT(DISTINCT v.id_visita) FILTER (WHERE v.estado = 'pendiente')                        AS pendientes,
              COUNT(DISTINCT v.id_visita) FILTER (WHERE v.estado = 'en_triaje')                        AS en_triaje,
              COUNT(DISTINCT v.id_visita) FILTER (WHERE v.estado = 'completado')                       AS completados,
              COUNT(DISTINCT v.id_visita) FILTER (WHERE v.fecha_visita >= NOW() - INTERVAL '1 hour')   AS ultima_hora
            FROM visita v
            WHERE v.fecha_visita::DATE = CURRENT_DATE
        `);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// ============================================================
// PACIENTES
// ============================================================
app.get('/api/patients', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              id_paciente,
              nombre_completo,
              dpi,
              DATE_PART('year', AGE(fecha_nacimiento))::INT AS edad,
              sexo,
              es_cronico,
              fecha_registro
            FROM paciente
            WHERE activo = TRUE
            ORDER BY fecha_registro DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo pacientes' });
    }
});

app.post('/api/patients', async (req, res) => {
    const { nombre_completo, dpi, fecha_nacimiento, sexo, telefono, direccion, id_usuario_registro } = req.body;
    if (!nombre_completo || !fecha_nacimiento || !sexo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, fecha de nacimiento y sexo' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO paciente (nombre_completo, dpi, fecha_nacimiento, sexo, telefono, direccion, id_usuario_registro)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_paciente`,
            [nombre_completo, dpi || null, fecha_nacimiento, sexo, telefono || null, direccion || null, id_usuario_registro || 1]
        );
        await pool.query(
            `INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro_afectado, descripcion)
             VALUES ($1, 'CREAR_PACIENTE', 'paciente', $2, $3)`,
            [id_usuario_registro || 1, rows[0].id_paciente, `Registro de nuevo paciente: ${nombre_completo}`]
        );
        res.status(201).json({ id: rows[0].id_paciente, message: 'Paciente registrado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un paciente con ese DPI' });
        }
        res.status(500).json({ error: 'Error al registrar paciente' });
    }
});

// ============================================================
// EXPEDIENTE DE PACIENTE
// ============================================================
app.get('/api/expediente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: pRows } = await pool.query(
            `SELECT *, DATE_PART('year', AGE(fecha_nacimiento))::INT AS edad
             FROM paciente WHERE id_paciente = $1`, [id]
        );
        if (pRows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

        const { rows: visitas } = await pool.query(`
            SELECT v.*,
                   pr.presion_sistolica, pr.presion_diastolica, pr.frecuencia_cardiaca,
                   pr.temperatura, pr.peso, pr.talla, pr.imc, pr.saturacion_oxigeno,
                   pr.alerta_signos, pr.detalle_alerta,
                   cm.diagnostico, cm.indicaciones, cm.observaciones, cm.fecha_seguimiento,
                   u.nombre_completo AS nombre_medico
            FROM visita v
            LEFT JOIN preconsulta pr    ON v.id_visita = pr.id_visita
            LEFT JOIN consulta_medica cm ON v.id_visita = cm.id_visita
            LEFT JOIN usuario u          ON cm.id_medico = u.id_usuario
            WHERE v.id_paciente = $1
            ORDER BY v.fecha_visita DESC
        `, [id]);

        res.json({ paciente: pRows[0], visitas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo expediente' });
    }
});

// ============================================================
// USUARIOS (Control de acceso)
// ============================================================
app.get('/api/usuarios', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT u.id_usuario, u.nombre_completo, u.nombre_usuario,
                   u.activo, u.fecha_creacion, u.ultimo_acceso, r.nombre_rol
            FROM usuario u
            INNER JOIN rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

app.post('/api/usuarios', async (req, res) => {
    const { nombre_completo, nombre_usuario, contrasena, id_rol } = req.body;
    if (!nombre_completo || !nombre_usuario || !contrasena || !id_rol) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    try {
        const hash = await bcrypt.hash(contrasena, 10);
        const { rows } = await pool.query(
            `INSERT INTO usuario (nombre_completo, nombre_usuario, contrasena_hash, id_rol)
             VALUES ($1, $2, $3, $4) RETURNING id_usuario`,
            [nombre_completo, nombre_usuario, hash, id_rol]
        );
        res.status(201).json({ id: rows[0].id_usuario, message: 'Usuario creado correctamente' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE usuario SET activo = FALSE WHERE id_usuario = $1', [id]);
        res.json({ message: 'Usuario desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desactivar usuario' });
    }
});

// ============================================================
// AVISOS DEL SISTEMA
// ============================================================
app.get('/api/avisos', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT * FROM aviso_sistema
            WHERE activo = TRUE AND (fecha_fin IS NULL OR fecha_fin > NOW())
            ORDER BY fecha_inicio DESC LIMIT 10
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo avisos' });
    }
});

// ============================================================
// ROLES
// ============================================================
app.get('/api/roles', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM rol ORDER BY id_rol');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo roles' });
    }
});

// ============================================================
// VISITAS - CREAR
// ============================================================
app.post('/api/visitas', async (req, res) => {
    const { id_paciente, motivo_consulta, id_usuario_registro } = req.body;
    if (!id_paciente || !id_usuario_registro) {
        return res.status(400).json({ error: 'Paciente y usuario son requeridos' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO visita (id_paciente, motivo_consulta, id_usuario_registro, estado)
             VALUES ($1, $2, $3, 'pendiente') RETURNING *`,
            [id_paciente, motivo_consulta || null, id_usuario_registro]
        );
        const visita = rows[0];
        await pool.query(
            `INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro_afectado, descripcion)
             VALUES ($1, 'CREAR_VISITA', 'visita', $2, $3)`,
            [id_usuario_registro, visita.id_visita, `Nueva visita para paciente ID ${id_paciente}`]
        );
        res.status(201).json(visita);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear visita' });
    }
});

app.get('/api/visitas/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              v.*,
              p.nombre_completo,
              p.dpi,
              DATE_PART('year', AGE(p.fecha_nacimiento))::INT AS edad,
              p.sexo
            FROM visita v
            INNER JOIN paciente p ON v.id_paciente = p.id_paciente
            WHERE v.id_visita = $1
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Visita no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo visita' });
    }
});

// ============================================================
// PRECONSULTA - REGISTRAR SIGNOS VITALES
// ============================================================
app.post('/api/preconsulta', async (req, res) => {
    const {
        id_visita,
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        frecuencia_respiratoria,
        saturacion_oxigeno,
        peso,
        talla,
        id_usuario_registro
    } = req.body;

    if (!id_visita || !id_usuario_registro) {
        return res.status(400).json({ error: 'Visita y usuario son requeridos' });
    }

    const imc = peso && talla ? (peso / (talla * talla)).toFixed(2) : null;

    const alerta_signos = (
        (presion_sistolica && (presion_sistolica > 140 || presion_sistolica < 90)) ||
        (presion_diastolica && (presion_diastolica > 90 || presion_diastolica < 60)) ||
        (frecuencia_cardiaca && (frecuencia_cardiaca > 100 || frecuencia_cardiaca < 60)) ||
        (temperatura && (temperatura > 37.5 || temperatura < 35.5)) ||
        (saturacion_oxigeno && saturacion_oxigeno < 95)
    );

    let detalle_alerta = [];
    if (presion_sistolica && (presion_sistolica > 140 || presion_sistolica < 90)) detalle_alerta.push(`Presión sistólica: ${presion_sistolica}`);
    if (presion_diastolica && (presion_diastolica > 90 || presion_diastolica < 60)) detalle_alerta.push(`Presión diastólica: ${presion_diastolica}`);
    if (frecuencia_cardiaca && (frecuencia_cardiaca > 100 || frecuencia_cardiaca < 60)) detalle_alerta.push(`FC: ${frecuencia_cardiaca}`);
    if (temperatura && (temperatura > 37.5 || temperatura < 35.5)) detalle_alerta.push(`Temp: ${temperatura}°C`);
    if (saturacion_oxigeno && saturacion_oxigeno < 95) detalle_alerta.push(`SpO2: ${saturacion_oxigeno}%`);

    try {
        await pool.query('BEGIN');

        const { rows } = await pool.query(
            `INSERT INTO preconsulta (
                id_visita, presion_sistolica, presion_diastolica, frecuencia_cardiaca,
                temperatura, frecuencia_respiratoria, saturacion_oxigeno,
                peso, talla, imc, alerta_signos, detalle_alerta, id_usuario_registro
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             ON CONFLICT (id_visita) DO UPDATE SET
                presion_sistolica = EXCLUDED.presion_sistolica,
                presion_diastolica = EXCLUDED.presion_diastolica,
                frecuencia_cardiaca = EXCLUDED.frecuencia_cardiaca,
                temperatura = EXCLUDED.temperatura,
                frecuencia_respiratoria = EXCLUDED.frecuencia_respiratoria,
                saturacion_oxigeno = EXCLUDED.saturacion_oxigeno,
                peso = EXCLUDED.peso,
                talla = EXCLUDED.talla,
                imc = EXCLUDED.imc,
                alerta_signos = EXCLUDED.alerta_signos,
                detalle_alerta = EXCLUDED.detalle_alerta,
                id_usuario_registro = EXCLUDED.id_usuario_registro,
                fecha_hora_registro = NOW()
             RETURNING *`,
            [
                id_visita,
                presion_sistolica || null,
                presion_diastolica || null,
                frecuencia_cardiaca || null,
                temperatura || null,
                frecuencia_respiratoria || null,
                saturacion_oxigeno || null,
                peso || null,
                talla || null,
                imc,
                alerta_signos,
                detalle_alerta.join('; ') || null,
                id_usuario_registro
            ]
        );

        await pool.query(
            `UPDATE visita SET estado = 'en_triaje' WHERE id_visita = $1`,
            [id_visita]
        );

        await pool.query(
            `INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro_afectado, descripcion)
             VALUES ($1, 'REGISTRAR_PRECONSULTA', 'preconsulta', $2, $3)`,
            [id_usuario_registro, id_visita, `Signos vitales registrados${alerta_signos ? ' - ALERTA: ' + detalle_alerta.join(', ') : ''}`]
        );

        await pool.query('COMMIT');
        res.status(201).json({ ...rows[0], alerta_signos, detalle_alerta: detalle_alerta.join('; ') });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error al registrar preconsulta' });
    }
});

// ============================================================
// CONSULTA MÉDICA - REGISTRAR DIAGNÓSTICO
// ============================================================
app.post('/api/consulta_medica', async (req, res) => {
    const { id_visita, diagnostico, indicaciones, observaciones, fecha_seguimiento, id_medico } = req.body;
    if (!id_visita || !id_medico) {
        return res.status(400).json({ error: 'Visita y médico son requeridos' });
    }
    try {
        await pool.query('BEGIN');

        const { rows } = await pool.query(
            `INSERT INTO consulta_medica (id_visita, diagnostico, indicaciones, observaciones, fecha_seguimiento, id_medico)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id_visita) DO UPDATE SET
                diagnostico = EXCLUDED.diagnostico,
                indicaciones = EXCLUDED.indicaciones,
                observaciones = EXCLUDED.observaciones,
                fecha_seguimiento = EXCLUDED.fecha_seguimiento,
                id_medico = EXCLUDED.id_medico,
                fecha_hora_consulta = NOW()
             RETURNING *`,
            [id_visita, diagnostico || null, indicaciones || null, observaciones || null, fecha_seguimiento || null, id_medico]
        );

        await pool.query(
            `UPDATE visita SET estado = 'completado' WHERE id_visita = $1`,
            [id_visita]
        );

        await pool.query(
            `INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro_afectado, descripcion)
             VALUES ($1, 'REGISTRAR_CONSULTA', 'consulta_medica', $2, $3)`,
            [id_medico, id_visita, `Diagnóstico: ${diagnostico?.substring(0, 100) || 'N/A'}`]
        );

        await pool.query('COMMIT');
        res.status(201).json(rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error al registrar consulta médica' });
    }
});

// ============================================================
// OBTENER PRECONSULTA DE UNA VISITA
// ============================================================
app.get('/api/preconsulta/:id_visita', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM preconsulta WHERE id_visita = $1`,
            [req.params.id_visita]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Preconsulta no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo preconsulta' });
    }
});

// ============================================================
// OBTENER CONSULTA MÉDICA DE UNA VISITA
// ============================================================
app.get('/api/consulta_medica/:id_visita', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT cm.*, u.nombre_completo AS nombre_medico
             FROM consulta_medica cm
             LEFT JOIN usuario u ON cm.id_medico = u.id_usuario
             WHERE cm.id_visita = $1`,
            [req.params.id_visita]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo consulta médica' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend server (PostgreSQL) running on http://localhost:${PORT}`);
});
