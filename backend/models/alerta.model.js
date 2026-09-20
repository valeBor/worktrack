const db = require('../config/db');

function placeholders(cantidad) {
  return Array(cantidad).fill('?').join(', ');
}

exports.getActorConRol = async (actorId) => {
  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.estado,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [actorId]);
  return rows[0] || null;
};

exports.getUsuariosVisibles = async (actorId, role) => {
  let filtro = 'u.id = ?';
  let parametros = [actorId];

  if (role === 'supervisor') {
    filtro = "(u.id = ? OR LOWER(r.nombre) = 'empleado')";
  } else if (role === 'rrhh' || role === 'admin') {
    filtro = "LOWER(r.nombre) IN ('empleado', 'supervisor')";
    parametros = [];
  }

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.estado = 1
      AND ${filtro}
    ORDER BY u.apellido, u.nombre, u.id
  `;

  const [rows] = await db.query(sql, parametros);
  return rows;
};

exports.getAsistencias = async (usuarioIds, fechaDesde, fechaHasta) => {
  if (usuarioIds.length === 0) return [];

  const sql = `
    SELECT
      a.id,
      a.usuario_id,
      DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
      a.hora_entrada,
      a.hora_salida,
      a.estado
    FROM asistencia a
    WHERE a.usuario_id IN (${placeholders(usuarioIds.length)})
      AND a.fecha BETWEEN ? AND ?
    ORDER BY a.usuario_id, a.fecha, a.id DESC
  `;

  const [rows] = await db.query(sql, [
    ...usuarioIds,
    fechaDesde,
    fechaHasta
  ]);

  return rows;
};

exports.getHorarios = async (usuarioIds, fechaDesde, fechaHasta) => {
  if (usuarioIds.length === 0) return [];

  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      DATE_FORMAT(h.vigente_desde, '%Y-%m-%d') AS vigente_desde,
      DATE_FORMAT(h.vigente_hasta, '%Y-%m-%d') AS vigente_hasta
    FROM horarios h
    WHERE h.usuario_id IN (${placeholders(usuarioIds.length)})
      AND h.vigente_desde <= ?
      AND (
        h.vigente_hasta IS NULL
        OR h.vigente_hasta >= ?
      )
    ORDER BY h.usuario_id, h.vigente_desde DESC, h.id DESC
  `;

  const [rows] = await db.query(sql, [
    ...usuarioIds,
    fechaHasta,
    fechaDesde
  ]);

  return rows;
};

exports.getCambiosAprobados = async (usuarioIds, fechaDesde, fechaHasta) => {
  if (usuarioIds.length === 0) return [];

  const sql = `
    SELECT
      s.id,
      s.usuario_id,
      DATE_FORMAT(s.fecha_solicitada, '%Y-%m-%d') AS fecha_solicitada,
      s.hora_entrada_solicitada,
      s.hora_salida_solicitada,
      s.modalidad_solicitada,
      s.tolerancia_actual
    FROM solicitudes s
    WHERE s.usuario_id IN (${placeholders(usuarioIds.length)})
      AND s.tipo = 'CAMBIO_HORARIO'
      AND s.estado = 'APROBADA'
      AND s.fecha_solicitada BETWEEN ? AND ?
    ORDER BY s.usuario_id, s.fecha_solicitada, s.id DESC
  `;

  const [rows] = await db.query(sql, [
    ...usuarioIds,
    fechaDesde,
    fechaHasta
  ]);

  return rows;
};

// ======================================================
// JUSTIFICACIONES APROBADAS
// ======================================================

exports.getJustificacionesAprobadas = async (
  usuarioIds,
  fechaDesde,
  fechaHasta
) => {
  if (usuarioIds.length === 0) {
    return [];
  }

  const sql = `
    SELECT
      s.id,
      s.usuario_id,
      DATE_FORMAT(
        s.fecha_inasistencia,
        '%Y-%m-%d'
      ) AS fecha_inasistencia
    FROM solicitudes s
    WHERE s.usuario_id IN (${placeholders(usuarioIds.length)})
      AND s.tipo = 'JUSTIFICACION_INASISTENCIA'
      AND s.estado = 'APROBADA'
      AND s.fecha_inasistencia BETWEEN ? AND ?
    ORDER BY
      s.usuario_id,
      s.fecha_inasistencia,
      s.id DESC
  `;

  const [rows] = await db.query(sql, [
    ...usuarioIds,
    fechaDesde,
    fechaHasta
  ]);

  return rows;
};