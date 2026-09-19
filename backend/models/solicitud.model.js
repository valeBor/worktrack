const db = require('../config/db');

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
  s.modalidad_solicitada,
  s.motivo,
  s.fecha_inasistencia,
  s.tipo_justificativo_id,
  s.creada_en,
  s.respuesta,
  s.resuelto_por,
  s.resuelta_en
`;

const CAMPOS_TIPO_JUSTIFICATIVO = `
  tj.codigo AS tipo_justificativo,
  tj.nombre AS tipo_justificativo_nombre,
  tj.requiere_archivo AS requiere_archivo
`;


exports.create = async (
  connection,
  solicitud
) => {
  const [result] = await connection.query(`
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
      modalidad_solicitada,
      motivo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
    solicitud.modalidad_solicitada,
    solicitud.motivo
  ]);

  return result;
};

exports.getByUsuario = async usuarioId => {
  const [rows] = await db.query(`
    SELECT
      ${CAMPOS_SOLICITUD},
      ${CAMPOS_TIPO_JUSTIFICATIVO},
      responsable.nombre AS responsable_nombre,
      responsable.apellido AS responsable_apellido,
      archivo.id AS archivo_id,
      archivo.nombre_original AS archivo_nombre_original,
      archivo.mime_type AS archivo_mime_type,
      archivo.tamanio_bytes AS archivo_tamanio_bytes
    FROM solicitudes s
    LEFT JOIN tipos_justificativo tj
      ON tj.id = s.tipo_justificativo_id
    LEFT JOIN usuarios responsable
      ON responsable.id = s.resuelto_por
    LEFT JOIN solicitud_archivos archivo
      ON archivo.solicitud_id = s.id
    WHERE s.usuario_id = ?
    ORDER BY
      s.creada_en DESC,
      s.id DESC
  `, [usuarioId]);

  return rows;
};

exports.getPendientes = async () => {
  const [rows] = await db.query(`
    SELECT
      ${CAMPOS_SOLICITUD},
      ${CAMPOS_TIPO_JUSTIFICATIVO},
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email,
      r.nombre AS usuario_role,
      archivo.id AS archivo_id,
      archivo.nombre_original AS archivo_nombre_original,
      archivo.mime_type AS archivo_mime_type,
      archivo.tamanio_bytes AS archivo_tamanio_bytes
    FROM solicitudes s
    JOIN usuarios u
      ON u.id = s.usuario_id
    JOIN roles r
      ON r.id = u.rol_id
    LEFT JOIN tipos_justificativo tj
      ON tj.id = s.tipo_justificativo_id
    LEFT JOIN solicitud_archivos archivo
      ON archivo.solicitud_id = s.id
    WHERE s.estado = 'PENDIENTE'
    ORDER BY
      s.creada_en ASC,
      s.id ASC
  `);

  return rows;
};

exports.getGestionables = async () => {
  const [rows] = await db.query(`
    SELECT
      ${CAMPOS_SOLICITUD},
      ${CAMPOS_TIPO_JUSTIFICATIVO},
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.email AS usuario_email,
      r.nombre AS usuario_role,
      responsable.nombre AS responsable_nombre,
      responsable.apellido AS responsable_apellido,
      responsable_rol.nombre AS responsable_role,
      archivo.id AS archivo_id,
      archivo.nombre_original AS archivo_nombre_original,
      archivo.mime_type AS archivo_mime_type,
      archivo.tamanio_bytes AS archivo_tamanio_bytes
    FROM solicitudes s
    JOIN usuarios u
      ON u.id = s.usuario_id
    JOIN roles r
      ON r.id = u.rol_id
    LEFT JOIN tipos_justificativo tj
      ON tj.id = s.tipo_justificativo_id
    LEFT JOIN usuarios responsable
      ON responsable.id = s.resuelto_por
    LEFT JOIN roles responsable_rol
      ON responsable_rol.id = responsable.rol_id
    LEFT JOIN solicitud_archivos archivo
      ON archivo.solicitud_id = s.id
    WHERE s.estado IN (
      'PENDIENTE',
      'APROBADA',
      'RECHAZADA'
    )
    ORDER BY
      CASE
        WHEN s.estado = 'PENDIENTE' THEN 0
        WHEN s.estado = 'APROBADA' THEN 1
        ELSE 2
      END,
      s.creada_en DESC,
      s.id DESC
  `);

  return rows;
};

exports.getActivaByUsuarioAndFecha = async (
  connection,
  usuarioId,
  fechaSolicitada
) => {
  const [rows] = await connection.query(`
    SELECT
      id,
      estado
    FROM solicitudes
    WHERE usuario_id = ?
      AND tipo = 'CAMBIO_HORARIO'
      AND fecha_solicitada = ?
      AND estado IN (
        'PENDIENTE',
        'APROBADA'
      )
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [
    usuarioId,
    fechaSolicitada
  ]);

  return rows[0];
};

exports.getJustificacionActivaByUsuarioAndFecha = async (
  connection,
  usuarioId,
  fechaInasistencia
) => {
  const [rows] = await connection.query(`
    SELECT
      id,
      estado
    FROM solicitudes
    WHERE usuario_id = ?
      AND tipo = 'JUSTIFICACION_INASISTENCIA'
      AND fecha_inasistencia = ?
      AND estado IN (
        'PENDIENTE',
        'APROBADA'
      )
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [
    usuarioId,
    fechaInasistencia
  ]);

  return rows[0] || null;
};

exports.getByIdForUpdate = async (
  connection,
  solicitudId
) => {
  const [rows] = await connection.query(`
    SELECT
      ${CAMPOS_SOLICITUD},
      ${CAMPOS_TIPO_JUSTIFICATIVO}
    FROM solicitudes s
    LEFT JOIN tipos_justificativo tj
      ON tj.id = s.tipo_justificativo_id
    WHERE s.id = ?
    LIMIT 1
    FOR UPDATE
  `, [solicitudId]);

  return rows[0];
};

exports.resolve = async (
  connection,
  solicitudId,
  estado,
  respuesta,
  responsableId,
  fechaResolucion
) => {
  const [result] = await connection.query(`
    UPDATE solicitudes
    SET
      estado = ?,
      respuesta = ?,
      resuelto_por = ?,
      resuelta_en = ?
    WHERE id = ?
      AND estado = 'PENDIENTE'
  `, [
    estado,
    respuesta,
    responsableId,
    fechaResolucion,
    solicitudId
  ]);

  return result;
};

exports.getAprobadaByUsuarioAndFecha = async (
  connection,
  usuarioId,
  fechaSolicitada
) => {
  const [rows] = await connection.query(`
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
  `, [
    usuarioId,
    fechaSolicitada
  ]);

  return rows[0];
};

exports.getAprobadasByUsuarioAndPeriodo = async (
  usuarioId,
  fechaDesde,
  fechaHasta
) => {
  const [rows] = await db.query(`
    SELECT
      id,
      usuario_id,
      DATE_FORMAT(
        fecha_solicitada,
        '%Y-%m-%d'
      ) AS fecha_solicitada,
      hora_entrada_actual,
      hora_salida_actual,
      modalidad_actual,
      tolerancia_actual,
      hora_entrada_solicitada,
      hora_salida_solicitada,
      modalidad_solicitada,
      motivo,
      respuesta,
      resuelto_por,
      resuelta_en
    FROM solicitudes
    WHERE usuario_id = ?
      AND tipo = 'CAMBIO_HORARIO'
      AND estado = 'APROBADA'
      AND fecha_solicitada BETWEEN ? AND ?
    ORDER BY
      fecha_solicitada ASC,
      id ASC
  `, [
    usuarioId,
    fechaDesde,
    fechaHasta
  ]);

  return rows;
};

exports.getPrimeraAprobadaByUsuario = async usuarioId => {
  const [rows] = await db.query(`
    SELECT
      DATE_FORMAT(
        MIN(fecha_solicitada),
        '%Y-%m-%d'
      ) AS primera_fecha
    FROM solicitudes
    WHERE usuario_id = ?
      AND tipo = 'CAMBIO_HORARIO'
      AND estado = 'APROBADA'
  `, [usuarioId]);

  return rows[0]?.primera_fecha || null;
};

exports.getTipoJustificativoByCodigo = async (
  connection,
  codigo
) => {
  const [rows] = await connection.query(`
    SELECT
      id,
      codigo,
      nombre,
      requiere_archivo
    FROM tipos_justificativo
    WHERE codigo = ?
      AND activo = 1
    LIMIT 1
  `, [codigo]);

  return rows[0] || null;
};

exports.createJustificativo = async (
  connection,
  justificativo
) => {
  const [result] = await connection.query(`
    INSERT INTO solicitudes (
      usuario_id,
      tipo,
      estado,
      motivo,
      fecha_inasistencia,
      tipo_justificativo_id
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    justificativo.usuario_id,
    'JUSTIFICACION_INASISTENCIA',
    'PENDIENTE',
    justificativo.motivo,
    justificativo.fecha_inasistencia,
    justificativo.tipo_justificativo_id
  ]);

  return result;
};

exports.createArchivo = async (
  connection,
  archivo
) => {
  const [result] = await connection.query(`
    INSERT INTO solicitud_archivos (
      solicitud_id,
      storage_provider,
      storage_key,
      nombre_original,
      mime_type,
      extension,
      tamanio_bytes,
      sha256,
      creado_por
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    archivo.solicitud_id,
    archivo.storage_provider,
    archivo.storage_key,
    archivo.nombre_original,
    archivo.mime_type,
    archivo.extension,
    archivo.tamanio_bytes,
    archivo.sha256,
    archivo.creado_por
  ]);

  return result;
};

exports.getArchivoById = async archivoId => {
  const [rows] = await db.query(`
    SELECT
      archivo.id,
      archivo.solicitud_id,
      archivo.storage_provider,
      archivo.storage_key,
      archivo.nombre_original,
      archivo.mime_type,
      archivo.extension,
      archivo.tamanio_bytes,
      archivo.sha256,
      archivo.creado_por,
      archivo.creado_en,
      s.usuario_id AS solicitante_id,
      s.tipo AS solicitud_tipo,
      s.estado AS solicitud_estado,
      r.nombre AS solicitante_role
    FROM solicitud_archivos archivo
    JOIN solicitudes s
      ON s.id = archivo.solicitud_id
    JOIN usuarios u
      ON u.id = s.usuario_id
    JOIN roles r
      ON r.id = u.rol_id
    WHERE archivo.id = ?
    LIMIT 1
  `, [archivoId]);

  return rows[0] || null;
};

exports.createArchivoAcceso = async acceso => {
  const [result] = await db.query(`
    INSERT INTO solicitud_archivo_accesos (
      archivo_id,
      usuario_id,
      accion,
      ip_actor
    )
    VALUES (?, ?, ?, ?)
  `, [
    acceso.archivo_id,
    acceso.usuario_id,
    acceso.accion,
    acceso.ip_actor
  ]);

  return result;
};