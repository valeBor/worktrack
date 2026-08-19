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

// ======================================================
// BUSCAR USUARIO POR EMAIL
// ======================================================
//
// Esta función se utiliza cuando el usuario solicita
// recuperar su contraseña.
//
// Incluimos password porque el backend necesita su hash
// para firmar el token de recuperación.
//
// El hash nunca será enviado al frontend.
// ======================================================

exports.getByEmail = async (email) => {

  const query = `
    SELECT
      id,
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    FROM usuarios
    WHERE email = ?
    LIMIT 1
  `;


  const [rows] = await db.query(
    query,
    [email]
  );


  // Si existe, devuelve el primer usuario.
  //
  // Si no existe, devuelve undefined.
  return rows[0];

};


// ======================================================
// BUSCAR USUARIO POR ID
// ======================================================
//
// El ID se obtiene inicialmente del token.
//
// Después de encontrar al usuario,
// authService verificará criptográficamente
// que el token sea realmente válido.
// ======================================================

exports.getById = async (id) => {

  const query = `
    SELECT
      id,
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    FROM usuarios
    WHERE id = ?
    LIMIT 1
  `;


  const [rows] = await db.query(
    query,
    [id]
  );


  return rows[0];

};


// ======================================================
// ACTUALIZAR SOLAMENTE LA CONTRASEÑA
// ======================================================
//
// hashedPassword ya llega procesada con bcrypt.
//
// Nunca recibimos ni guardamos directamente
// la contraseña escrita por el usuario.
// ======================================================

exports.updatePassword = async (
  id,
  hashedPassword
) => {

  const query = `
    UPDATE usuarios
    SET password = ?
    WHERE id = ?
  `;


  const [result] = await db.query(
    query,
    [
      hashedPassword,
      id
    ]
  );


  return result;

};