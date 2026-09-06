const db = require('../config/db');

// ======================================================
// OBTENER USUARIO CON SU ROL
// ======================================================

exports.getUsuarioById = async usuarioId => {
  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      u.cuenta_bloqueada,
      u.rol_id,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [usuarioId]);
  return rows[0];
};

// ======================================================
// USUARIOS DISPONIBLES PARA EL HISTORIAL
// ======================================================
//
// admin y rrhh:
// Pueden consultar a todos los demás usuarios.
//
// supervisor:
// Puede consultar usuarios con rol empleado.
//
// Los usuarios inactivos también se incluyen porque
// sus registros históricos deben permanecer disponibles.
// ======================================================

exports.getUsuariosGestionables = async actorId => {
  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      u.rol_id,
      r.nombre AS role
    FROM usuarios actor
    JOIN roles actor_rol
      ON actor.rol_id = actor_rol.id
    JOIN usuarios u
      ON u.id <> actor.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE actor.id = ?
      AND actor.estado = 1
      AND actor.cuenta_bloqueada = 0
      AND (
        LOWER(actor_rol.nombre) IN (
          'admin',
          'rrhh'
        )
        OR (
          LOWER(actor_rol.nombre) = 'supervisor'
          AND LOWER(r.nombre) = 'empleado'
        )
      )
    ORDER BY
      u.estado DESC,
      u.apellido,
      u.nombre,
      u.id
  `;

  const [rows] = await db.query(sql, [actorId]);

  return rows.map(usuario => ({
    ...usuario,
    estado: Boolean(usuario.estado)
  }));
};

// ======================================================
// VALIDAR USUARIO GESTIONABLE
// ======================================================
//
// Devuelve el usuario objetivo únicamente cuando el
// actor tiene autorización jerárquica para consultarlo.
// Esta validación evita modificar usuario_id desde Angular
// para acceder al historial de otra persona.
// ======================================================

exports.getUsuarioGestionable = async (
  actorId,
  usuarioObjetivoId
) => {
  const sql = `
    SELECT
      objetivo.id,
      objetivo.nombre,
      objetivo.apellido,
      objetivo.email,
      objetivo.estado,
      objetivo.rol_id,
      objetivo_rol.nombre AS role
    FROM usuarios actor
    JOIN roles actor_rol
      ON actor.rol_id = actor_rol.id
    JOIN usuarios objetivo
      ON objetivo.id = ?
      AND objetivo.id <> actor.id
    JOIN roles objetivo_rol
      ON objetivo.rol_id = objetivo_rol.id
    WHERE actor.id = ?
      AND actor.estado = 1
      AND actor.cuenta_bloqueada = 0
      AND (
        LOWER(actor_rol.nombre) IN (
          'admin',
          'rrhh'
        )
        OR (
          LOWER(actor_rol.nombre) = 'supervisor'
          AND LOWER(objetivo_rol.nombre) = 'empleado'
        )
      )
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioObjetivoId,
    actorId
  ]);

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    estado: Boolean(rows[0].estado)
  };
};