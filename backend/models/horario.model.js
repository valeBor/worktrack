const db = require("../config/db");


// ======================================================
// OBTENER TODOS LOS HORARIOS
// ======================================================

exports.getAll = async () => {

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
      u.email

    FROM horarios h

    JOIN usuarios u
      ON h.usuario_id = u.id

    ORDER BY
      u.apellido,
      u.nombre,
      h.id
  `;

  const [rows] = await db.query(sql);

  return rows;
};


// ======================================================
// HORARIOS DE UN USUARIO
// ======================================================

exports.getByUsuario = async (usuarioId) => {

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

    ORDER BY id
  `;

  const [rows] = await db.query(
    sql,
    [usuarioId]
  );

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

  const [rows] = await db.query(
    sql,
    [
      usuarioId,
      diaSemana
    ]
  );

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
    INSERT INTO horarios
    (
      usuario_id,
      hora_entrada,
      hora_salida,
      dia_semana,
      tolerancia_minutos,
      modalidad
    )

    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] =
    await connection.query(
      sql,
      [
        horario.usuario_id,
        horario.hora_entrada,
        horario.hora_salida,
        horario.dia_semana,
        horario.tolerancia_minutos,
        horario.modalidad
      ]
    );

  return result;
};


// ======================================================
// MODIFICAR UN HORARIO
// ======================================================

exports.update = async (
  id,
  horario
) => {

  const sql = `
    UPDATE horarios

    SET
      hora_entrada = ?,
      hora_salida = ?,
      tolerancia_minutos = ?,
      modalidad = ?

    WHERE id = ?
  `;

  const [result] = await db.query(
    sql,
    [
      horario.hora_entrada,
      horario.hora_salida,
      horario.tolerancia_minutos,
      horario.modalidad,
      id
    ]
  );

  return result;
};


// ======================================================
// ELIMINAR
// ======================================================

exports.remove = async (id) => {

  const sql = `
    DELETE FROM horarios
    WHERE id = ?
  `;

  const [result] = await db.query(
    sql,
    [id]
  );

  return result;
};