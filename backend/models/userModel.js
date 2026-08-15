const db = require('../config/db');


// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================
//
// IMPORTANTE:
// No devolvemos password.
//
// Ni siquiera devolvemos el hash al frontend.
// ======================================================

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


// ======================================================
// CREAR USUARIO
// ======================================================
//
// La contraseña que llega acá YA debe estar hasheada.
// El hash se realiza en el controller.
// ======================================================

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


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================
//
// Tenemos DOS situaciones:
//
// 1. El administrador escribió una contraseña nueva.
//    → actualizamos también password.
//
// 2. El administrador dejó password vacío.
//    → NO modificamos la contraseña existente.
// ======================================================

exports.updateUser = async (id, userData) => {

  let query;
  let values;


  // ------------------------------------------------------
  // CASO 1
  // Hay una contraseña nueva
  // ------------------------------------------------------

  if (userData.password) {

    query = `
      UPDATE usuarios
      SET
        nombre = ?,
        apellido = ?,
        email = ?,
        password = ?,
        estado = ?,
        rol_id = ?
      WHERE id = ?
    `;

    values = [

      userData.nombre,
      userData.apellido,
      userData.email,
      userData.password,
      userData.estado,
      userData.rol_id,
      id

    ];

  } else {

    // ----------------------------------------------------
    // CASO 2
    // No se ingresó contraseña nueva
    // ----------------------------------------------------
    //
    // No incluimos password en el UPDATE.
    //
    // De esta manera MySQL conserva automáticamente
    // el hash que ya estaba guardado.
    // ----------------------------------------------------

    query = `
      UPDATE usuarios
      SET
        nombre = ?,
        apellido = ?,
        email = ?,
        estado = ?,
        rol_id = ?
      WHERE id = ?
    `;

    values = [

      userData.nombre,
      userData.apellido,
      userData.email,
      userData.estado,
      userData.rol_id,
      id

    ];

  }


  const [result] = await db.query(
    query,
    values
  );

  return result;
};


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUser = async (id) => {

  const query = `
    DELETE FROM usuarios
    WHERE id = ?
  `;

  const [result] = await db.query(
    query,
    [id]
  );

  return result;
};