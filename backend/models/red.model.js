const pool = require("../config/db");


/**
 * Obtiene las redes activas
 * correspondientes a un tipo:
 *
 * LOCAL
 * VPN
 */
exports.buscarRedesPorTipo = async (
  connection,
  tipoRed
) => {

  const db = connection || pool;

  const sql = `
    SELECT
      id,
      nombre,
      tipo,
      ip_rango,
      estado
    FROM redes_autorizadas
    WHERE tipo = ?
      AND estado = 1
  `;

  const [rows] = await db.query(sql, [
    tipoRed
  ]);

  return rows;
};