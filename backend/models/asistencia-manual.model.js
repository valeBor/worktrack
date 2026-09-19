const pool = require('../config/db');

const ALCANCE = `
  a.estado = 1
  AND a.cuenta_bloqueada = 0
  AND u.estado = 1
  AND u.id <> a.id
  AND (
    (LOWER(ra.nombre) = 'supervisor'
      AND LOWER(ru.nombre) = 'empleado')
    OR
    (LOWER(ra.nombre) = 'rrhh'
      AND LOWER(ru.nombre) IN ('empleado', 'supervisor'))
  )
`;

async function buscarUsuariosGestionables(actorId, usuarioId = null, connection = pool) {
  const filtroUsuario = usuarioId === null ? '' : 'AND u.id = ?';
  const parametros = usuarioId === null
    ? [actorId]
    : [actorId, usuarioId];

  const [rows] = await connection.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, ru.nombre AS role
    FROM usuarios a
    JOIN roles ra ON ra.id = a.rol_id
    JOIN usuarios u ON u.id <> a.id
    JOIN roles ru ON ru.id = u.rol_id
    WHERE a.id = ?
      AND ${ALCANCE}
      ${filtroUsuario}
    ORDER BY u.apellido, u.nombre, u.id
  `, parametros);

  return rows;
}

exports.getUsuariosGestionables = actorId =>
  buscarUsuariosGestionables(actorId);

exports.getUsuarioGestionable = async (connection, actorId, usuarioId) => {
  const rows = await buscarUsuariosGestionables(
    actorId, usuarioId, connection
  );
  return rows[0] || null;
};

exports.getAsistenciaParaActualizar = async (connection, usuarioId, fecha) => {
  const [rows] = await connection.query(`
    SELECT id, usuario_id, fecha, hora_entrada, hora_salida,
           tipo_asistencia, estado, origen_entrada, origen_salida
    FROM asistencia
    WHERE usuario_id = ? AND fecha = ?
    LIMIT 1
    FOR UPDATE
  `, [usuarioId, fecha]);

  return rows[0] || null;
};

exports.crearAsistencia = async (connection, datos) => {
  const [result] = await connection.query(`
    INSERT INTO asistencia (
      usuario_id, red_id, fecha, hora_entrada, hora_salida,
      tipo_asistencia, ubicacion, ip_detectada, estado,
      origen_entrada, origen_salida
    )
    VALUES (?, NULL, ?, ?, ?, ?, NULL, NULL, ?, 'MANUAL', ?)
  `, [
    datos.usuarioId,
    datos.fecha,
    datos.horaEntrada,
    datos.horaSalida,
    datos.modalidad,
    datos.estado,
    datos.horaSalida === null ? null : 'MANUAL'
  ]);

  return result.insertId;
};

exports.completarSalida = async (connection, asistenciaId, horaSalida) => {
  const [result] = await connection.query(`
    UPDATE asistencia
    SET hora_salida = ?, origen_salida = 'MANUAL'
    WHERE id = ? AND hora_salida IS NULL
  `, [horaSalida, asistenciaId]);

  return result.affectedRows;
};

const CAMPOS_AUDITORIA = [
  'asistencia_id',
  'usuario_id',
  'realizado_por',
  'accion',
  'contingencia',
  'motivo',
  'fecha',
  'hora_entrada_anterior',
  'hora_salida_anterior',
  'hora_entrada_nueva',
  'hora_salida_nueva',
  'estado_anterior',
  'estado_nuevo',
  'modalidad',
  'horario_entrada',
  'horario_salida',
  'tolerancia_minutos',
  'origen_horario',
  'solicitud_cambio_id',
  'ip_actor',
  'registrada_en'
];

exports.getAsistenciaPorIdParaActualizar = async (
  connection,
  asistenciaId
) => {
  const [rows] = await connection.query(`
    SELECT
      id,
      usuario_id,
      DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
      hora_entrada,
      hora_salida,
      tipo_asistencia,
      estado,
      origen_entrada,
      origen_salida
    FROM asistencia
    WHERE id = ?
    LIMIT 1
    FOR UPDATE
  `, [asistenciaId]);

  return rows[0] || null;
};

exports.getContextoAuditoria = async (connection, asistenciaId) => {
  const [rows] = await connection.query(`
    SELECT
      horario_entrada,
      horario_salida,
      tolerancia_minutos,
      origen_horario,
      solicitud_cambio_id
    FROM asistencia_auditoria
    WHERE asistencia_id = ?
    ORDER BY id ASC
    LIMIT 1
  `, [asistenciaId]);

  return rows[0] || null;
};


exports.crearAuditoria = async (connection, datos) => {
  const campos = CAMPOS_AUDITORIA.join(', ');
  const valores = CAMPOS_AUDITORIA.map(() => '?').join(', ');
  const parametros = CAMPOS_AUDITORIA.map(campo => datos[campo] ?? null);

  const [result] = await connection.query(
    `INSERT INTO asistencia_auditoria (${campos}) VALUES (${valores})`,
    parametros
  );

  return result.insertId;
};
const ALCANCE_REGISTROS = `
  FROM asistencia_auditoria au
  JOIN asistencia a ON a.id = au.asistencia_id
  JOIN usuarios u ON u.id = a.usuario_id
  JOIN roles r ON r.id = u.rol_id
  JOIN usuarios responsable ON responsable.id = au.realizado_por
  JOIN usuarios actor ON actor.id = ?
  JOIN roles actorRol ON actorRol.id = actor.rol_id
   WHERE actor.estado = 1
    AND actor.cuenta_bloqueada = 0
    AND (
      LOWER(actorRol.nombre) = 'admin'
      OR (
        u.id <> actor.id
        AND (
          (LOWER(actorRol.nombre) = 'supervisor'
            AND LOWER(r.nombre) = 'empleado')
          OR
          (LOWER(actorRol.nombre) = 'rrhh'
            AND LOWER(r.nombre) IN ('empleado', 'supervisor'))
        )
      )
    )
`;

exports.getRegistrosGestionables = async actorId => {
  const [ultimas] = await pool.query(`
    SELECT au.asistencia_id
    ${ALCANCE_REGISTROS}
    GROUP BY au.asistencia_id
    ORDER BY MAX(au.id) DESC
    LIMIT 30
  `, [actorId]);

  if (!ultimas.length) return [];

  const ids = ultimas.map(registro => registro.asistencia_id);
  const lugares = ids.map(() => '?').join(', ');

  const [rows] = await pool.query(`
    SELECT
      a.id AS asistencia_id,
      a.usuario_id,
      DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
      a.hora_entrada,
      a.hora_salida,
      a.tipo_asistencia,
      a.estado,
      a.origen_entrada,
      a.origen_salida,
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      r.nombre AS usuario_role,
      au.id AS evento_id,
      au.accion,
      au.contingencia,
      au.motivo,
      au.realizado_por,
      responsable.nombre AS responsable_nombre,
      responsable.apellido AS responsable_apellido,
      DATE_FORMAT(au.registrada_en, '%Y-%m-%d %H:%i:%s')
        AS registrada_en,
      au.hora_entrada_anterior,
      au.hora_salida_anterior,
      au.hora_entrada_nueva,
      au.hora_salida_nueva
    ${ALCANCE_REGISTROS}
      AND au.asistencia_id IN (${lugares})
    ORDER BY au.id DESC
  `, [actorId, ...ids]);

  return rows;
};