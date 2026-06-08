const pool = require("../config/db");

// Buscar asistencia del usuario en el día actual
exports.buscarAsistenciaHoy = async (usuarioId) => {
  const sql = `
    SELECT *
    FROM asistencia
    WHERE usuario_id = ?
    AND fecha = CURDATE()
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [usuarioId]);

  return rows[0];
};

// Registrar entrada
exports.registrarEntrada = async (usuarioId, tipoAsistencia = "presencial", ubicacion = null) => {
  const sql = `
    INSERT INTO asistencia 
    (usuario_id, fecha, hora_entrada, tipo_asistencia, ubicacion, estado)
    VALUES (?, CURDATE(), CURTIME(), ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    usuarioId,
    tipoAsistencia,
    ubicacion,
    "presente"
  ]);

  return result;
};

// Registrar salida
//modifica el registro de asistencia, sin entrada no puede registrar salida
exports.registrarSalida = async (asistenciaId) => {
  const sql = `
    UPDATE asistencia
    SET hora_salida = CURTIME()
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [asistenciaId]);

  return result;
};