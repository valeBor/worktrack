const db = require('../config/db');

// OBTENER TODOS
exports.getAllUsers = async () => {
  const query = `
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
  `;

  const [rows] = await db.query(query);
  return rows;
};

// CREAR
exports.createUser = async (userData) => {
  const query = `
    INSERT INTO usuarios
    (
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(query, [
    userData.nombre,
    userData.apellido,
    userData.email,
    userData.password,
    userData.estado,
    userData.rol_id
  ]);

  return result;
};

// EDITAR
exports.updateUser = async (id, userData) => {
  const query = `
    UPDATE usuarios
    SET
      nombre = ?,
      apellido = ?,
      email = ?,
      estado = ?,
      rol_id = ?
    WHERE id = ?
  `;

  const [result] = await db.query(query, [
    userData.nombre,
    userData.apellido,
    userData.email,
    userData.estado,
    userData.rol_id,
    id
  ]);

  return result;
};

// ELIMINAR
exports.deleteUser = async (id) => {
  const query = `
    DELETE FROM usuarios
    WHERE id = ?
  `;

  const [result] = await db.query(query, [id]);
  return result;
};