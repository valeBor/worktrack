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
 * Busca el horario asignado al usuario
 * para un día específico.
 */
exports.buscarHorarioHoy = async (
  connection,
  usuarioId,
  diaSemana
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
      modalidad
    FROM horarios
    WHERE usuario_id = ?
      AND LOWER(dia_semana) = LOWER(?)
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    diaSemana
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