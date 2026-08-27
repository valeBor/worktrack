const db = require('../config/db');

// ======================================================
// OBTENER USUARIO CON SU ROL
// ======================================================

exports.getUsuarioConRol = async (usuarioId) => {
  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
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
// USUARIOS GESTIONABLES SEGÚN ROLES
// ======================================================

exports.getUsuariosGestionables = async (roles) => {
  const placeholders = roles.map(() => '?').join(', ');

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      u.rol_id,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE LOWER(r.nombre) IN (${placeholders})
      AND u.estado = 1
    ORDER BY
      u.apellido,
      u.nombre
  `;

  const [rows] = await db.query(sql, roles);

  return rows;
};

// ======================================================
// OBTENER HORARIOS SEGÚN ROLES
// ======================================================

exports.getAllByRoles = async (roles) => {
  const placeholders = roles.map(() => '?').join(', ');

  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre AS role
    FROM horarios h
    JOIN usuarios u
      ON h.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE LOWER(r.nombre) IN (${placeholders})
    ORDER BY
      u.apellido,
      u.nombre,
      FIELD(
        LOWER(h.dia_semana),
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
        'domingo'
      )
  `;

  const [rows] = await db.query(sql, roles);

  return rows;
};

// ======================================================
// HORARIOS DE UN USUARIO
// ======================================================

exports.getByUsuario = async (usuarioId) => {
  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre AS role
    FROM horarios h
    JOIN usuarios u
      ON h.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE h.usuario_id = ?
    ORDER BY FIELD(
      LOWER(h.dia_semana),
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo'
    )
  `;

  const [rows] = await db.query(sql, [usuarioId]);

  return rows;
};

// ======================================================
// BUSCAR POR USUARIO Y DÍA
// ======================================================

exports.getByUsuarioAndDia = async (
  usuarioId,
  diaSemana
) => {
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

// ======================================================
// CREAR UN HORARIO
// ======================================================

exports.create = async (
  connection,
  horario
) => {
  const sql = `
    INSERT INTO horarios (
      usuario_id,
      hora_entrada,
      hora_salida,
      dia_semana,
      tolerancia_minutos,
      modalidad
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(sql, [
    horario.usuario_id,
    horario.hora_entrada,
    horario.hora_salida,
    horario.dia_semana,
    horario.tolerancia_minutos,
    horario.modalidad
  ]);

  return result;
};

// ======================================================
// ELIMINAR CRONOGRAMA EN UNA TRANSACCIÓN
// ======================================================

exports.removeByUsuario = async (
  connection,
  usuarioId
) => {
  const sql = `
    DELETE FROM horarios
    WHERE usuario_id = ?
  `;

  const [result] = await connection.query(sql, [
    usuarioId
  ]);

  return result;
};

// ======================================================
// ELIMINAR CRONOGRAMA COMPLETO
// ======================================================

exports.deleteByUsuario = async (usuarioId) => {
  const sql = `
    DELETE FROM horarios
    WHERE usuario_id = ?
  `;

  const [result] = await db.query(sql, [
    usuarioId
  ]);

  return result;
};