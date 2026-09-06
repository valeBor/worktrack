const db = require('../config/db');

// ======================================================
// VERIFICAR PERMISOS DE UN USUARIO
// ======================================================

exports.verificarPermisosUsuario = async (
  usuarioId,
  permisos
) => {
  const placeholders =
    permisos.map(() => '?').join(', ');

  const sql = `
    SELECT
      u.id,
      u.estado,
      u.cuenta_bloqueada,
      EXISTS (
        SELECT 1
        FROM rol_permiso rp
        JOIN permisos p
          ON rp.permiso_id = p.id
        WHERE rp.rol_id = u.rol_id
          AND p.nombre IN (${placeholders})
      ) AS autorizado
    FROM usuarios u
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(
    sql,
    [
      ...permisos,
      usuarioId
    ]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    usuario_id: Number(rows[0].id),
    estado: Boolean(rows[0].estado),
    cuenta_bloqueada:
      Boolean(rows[0].cuenta_bloqueada),
    autorizado:
      Boolean(rows[0].autorizado)
  };
};