const db = require('../config/db');


// ======================================================
// CAMPOS DE UNA SOLICITUD
// ======================================================

const CAMPOS_SOLICITUD = `
  s.id,
  s.usuario_id,
  s.tipo,
  s.estado,
  s.fecha_solicitada,
  s.hora_entrada_actual,
  s.hora_salida_actual,
  s.modalidad_actual,
  s.tolerancia_actual,
  s.hora_entrada_solicitada,
  s.hora_salida_solicitada,
  s.motivo,
  s.creada_en,
  s.respuesta,
  s.resuelto_por,
  s.resuelta_en
`;


// ======================================================
// CREAR SOLICITUD
// ======================================================

exports.create = async (
  connection,
  solicitud
) => {
  const sql = `
    INSERT INTO solicitudes (
      usuario_id,
      tipo,
      estado,
      fecha_solicitada,
      hora_entrada_actual,
      hora_salida_actual,
      modalidad_actual,
      tolerancia_actual,
      hora_entrada_solicitada,
      hora_salida_solicitada,
      motivo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(
    sql,
    [
      solicitud.usuario_id,
      solicitud.tipo,
      solicitud.estado,
      solicitud.fecha_solicitada,
      solicitud.hora_entrada_actual,
      solicitud.hora_salida_actual,
      solicitud.modalidad_actual,
      solicitud.tolerancia_actual,
      solicitud.hora_entrada_solicitada,
      solicitud.hora_salida_solicitada,
      solicitud.motivo
    ]
  );

  return result;
};


// ======================================================
// OBTENER SOLICITUDES DE UN USUARIO
// ======================================================

exports.getByUsuario = async (usuarioId) => {
  const sql = `
    SELECT
      ${CAMPOS_SOLICITUD},
      responsable.nombre AS responsable_nombre,
      responsable.apellido AS responsable_apellido
    FROM solicitudes s
    LEFT JOIN usuarios responsable
      ON s.resuelto_por = responsable.id
    WHERE s.usuario_id = ?
    ORDER BY
      s.creada_en DESC,
      s.id DESC
  `;

  const [rows] = await db.query(
    sql,
    [usuarioId]
  );

  return rows;
};


// ======================================================
// OBTENER TODAS LAS SOLICITUDES PENDIENTES
// ======================================================

exports.getPendientes = async () => {
  const sql = `
    SELECT
      ${CAMPOS_SOLICITUD},
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email,
      r.nombre AS usuario_role
    FROM solicitudes s
    JOIN usuarios u
      ON s.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE s.estado = 'PENDIENTE'
    ORDER BY
      s.creada_en ASC,
      s.id ASC
  `;

  const [rows] = await db.query(sql);

  return rows;
};


// ======================================================
// BUSCAR SOLICITUD ACTIVA PARA UNA FECHA
// ======================================================

exports.getActivaByUsuarioAndFecha = async (
  connection,
  usuarioId,
  fechaSolicitada
) => {
  const sql = `
    SELECT
      id,
      estado
    FROM solicitudes
    WHERE usuario_id = ?
      AND fecha_solicitada = ?
      AND estado IN (
        'PENDIENTE',
        'APROBADA'
      )
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `;

  const [rows] = await connection.query(
    sql,
    [
      usuarioId,
      fechaSolicitada
    ]
  );

  return rows[0];
};


// ======================================================
// BUSCAR SOLICITUD POR ID PARA RESOLVER
// ======================================================

exports.getByIdForUpdate = async (
  connection,
  solicitudId
) => {
  const sql = `
    SELECT
      ${CAMPOS_SOLICITUD}
    FROM solicitudes s
    WHERE s.id = ?
    LIMIT 1
    FOR UPDATE
  `;

  const [rows] = await connection.query(
    sql,
    [solicitudId]
  );

  return rows[0];
};


// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================

exports.resolve = async (
  connection,
  solicitudId,
  estado,
  respuesta,
  responsableId,
  fechaResolucion
) => {
  const sql = `
    UPDATE solicitudes
    SET
      estado = ?,
      respuesta = ?,
      resuelto_por = ?,
      resuelta_en = ?
    WHERE id = ?
      AND estado = 'PENDIENTE'
  `;

  const [result] = await connection.query(
    sql,
    [
      estado,
      respuesta,
      responsableId,
      fechaResolucion,
      solicitudId
    ]
  );

  return result;
};

// ======================================================
// OBTENER CAMBIO APROBADO PARA UNA FECHA
// ======================================================

exports.getAprobadaByUsuarioAndFecha = async (
  connection,
  usuarioId,
  fechaSolicitada
) => {
  const sql = `
    SELECT
      ${CAMPOS_SOLICITUD}
    FROM solicitudes s
    WHERE s.usuario_id = ?
      AND s.fecha_solicitada = ?
      AND s.tipo = 'CAMBIO_HORARIO'
      AND s.estado = 'APROBADA'
    ORDER BY
      s.resuelta_en DESC,
      s.id DESC
    LIMIT 1
  `;

  const [rows] =
    await connection.query(
      sql,
      [
        usuarioId,
        fechaSolicitada
      ]
    );

  return rows[0];
};