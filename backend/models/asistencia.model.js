const pool = require("../config/db");


/**
 * Busca la asistencia del usuario para una fecha determinada.
 */
exports.buscarAsistenciaPorFecha = async (
  connection,
  usuarioId,
  fecha
) => {

  const db = connection || pool;

  const sql = `
    SELECT
      id,
      usuario_id,
      red_id,
      fecha,
      hora_entrada,
      hora_salida,
      tipo_asistencia,
      ubicacion,
      ip_detectada,
      estado
    FROM asistencia
    WHERE usuario_id = ?
      AND fecha = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    fecha
  ]);

  return rows[0];
};


/**
 * Busca el horario aplicable al usuario
 * para un día y una fecha determinados.
 */
exports.buscarHorarioParaFecha = async (
  connection,
  usuarioId,
  diaSemana,
  fecha
) => {
  const db = connection || pool;

  const sql = `
    SELECT
      id,
      usuario_id,
      dia_semana,
      hora_entrada,
      hora_salida,
      tolerancia_minutos,
      modalidad,
      vigente_desde,
      vigente_hasta
    FROM horarios
    WHERE usuario_id = ?
      AND LOWER(dia_semana) = LOWER(?)
      AND vigente_desde <= ?
      AND (
        vigente_hasta IS NULL
        OR vigente_hasta >= ?
      )
    ORDER BY
      vigente_desde DESC,
      id DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    diaSemana,
    fecha,
    fecha
  ]);

  return rows[0];
};
/**
 * Registra la entrada del empleado.
 */
exports.registrarEntrada = async (
  connection,
  usuarioId,
  redId,
  fecha,
  horaEntrada,
  tipoAsistencia,
  ubicacion,
  ipDetectada,
  estado
) => {

  const db = connection || pool;

  const sql = `
    INSERT INTO asistencia (
      usuario_id,
      red_id,
      fecha,
      hora_entrada,
      hora_salida,
      tipo_asistencia,
      ubicacion,
      ip_detectada,
      estado
    )
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    usuarioId,
    redId,
    fecha,
    horaEntrada,
    tipoAsistencia,
    ubicacion,
    ipDetectada,
    estado
  ]);

  return result;
};


/**
 * Registra la salida modificando
 * la asistencia existente.
 */
exports.registrarSalida = async (
  connection,
  asistenciaId,
  horaSalida,
  redId,
  ipDetectada
) => {

  const db = connection || pool;

  const sql = `
    UPDATE asistencia
    SET
      hora_salida = ?,
      red_id = ?,
      ip_detectada = ?
    WHERE id = ?
  `;

  const [result] = await db.query(sql, [
    horaSalida,
    redId,
    ipDetectada,
    asistenciaId
  ]);

  return result;
};

// ======================================================
// OBTENER ASISTENCIAS DE UN PERÍODO
// ======================================================

exports.getByUsuarioAndPeriodo = async (
  usuarioId,
  fechaDesde,
  fechaHasta
) => {
  const sql = `
    SELECT
      id,
      usuario_id,
      red_id,
      DATE_FORMAT(
        fecha,
        '%Y-%m-%d'
      ) AS fecha,
      hora_entrada,
      hora_salida,
      tipo_asistencia,
      ubicacion,
      ip_detectada,
      estado
    FROM asistencia
    WHERE usuario_id = ?
      AND fecha BETWEEN ? AND ?
    ORDER BY fecha DESC, id DESC
  `;

  const [rows] = await pool.query(sql, [
    usuarioId,
    fechaDesde,
    fechaHasta
  ]);

  return rows;
};

// ======================================================
// OBTENER PRIMERA FECHA DE ASISTENCIA
// ======================================================

exports.getPrimeraFechaByUsuario = async (
  usuarioId
) => {
  const sql = `
    SELECT
      DATE_FORMAT(
        MIN(fecha),
        '%Y-%m-%d'
      ) AS primera_fecha
    FROM asistencia
    WHERE usuario_id = ?
  `;

  const [rows] = await pool.query(sql, [
    usuarioId
  ]);

  return rows[0]?.primera_fecha || null;
};