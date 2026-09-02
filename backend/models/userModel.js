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
    rol_id = ?,
    intentos_fallidos = 0,
    cuenta_bloqueada = 0
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
// BUSCAR USUARIO POR EMAIL CON ROL
// ======================================================
//
// Se utiliza durante el login.
//
// Incluye el hash porque el backend necesita
// comparar la contraseña.
//
// El hash nunca se envía al frontend.
// ======================================================

exports.getByEmailWithRole = async (email) => {
  const query = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.password,
      u.estado,
      u.intentos_fallidos,
      u.cuenta_bloqueada,
      u.rol_id,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE u.email = ?
    LIMIT 1
  `;

  const [rows] = await db.query(
    query,
    [email]
  );

  return rows[0];
};

// ======================================================
// REGISTRAR INTENTO FALLIDO DE LOGIN
// ======================================================

exports.registrarIntentoFallido = async (id) => {
  const updateQuery = `
    UPDATE usuarios
    SET
      cuenta_bloqueada =
        CASE
          WHEN intentos_fallidos >= 4 THEN 1
          ELSE cuenta_bloqueada
        END,
      intentos_fallidos =
        LEAST(intentos_fallidos + 1, 5)
    WHERE id = ?
      AND cuenta_bloqueada = 0
  `;

  await db.query(
    updateQuery,
    [id]
  );

  const selectQuery = `
    SELECT
      intentos_fallidos,
      cuenta_bloqueada
    FROM usuarios
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(
    selectQuery,
    [id]
  );

  return rows[0];
};

// ======================================================
// REINICIAR INTENTOS FALLIDOS DE LOGIN
// ======================================================

exports.reiniciarIntentosLogin = async (id) => {
  const query = `
    UPDATE usuarios
    SET
      intentos_fallidos = 0,
      cuenta_bloqueada = 0
    WHERE id = ?
  `;

  const [result] = await db.query(
    query,
    [id]
  );

  return result;
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
  SET
    password = ?,
    intentos_fallidos = 0,
    cuenta_bloqueada = 0
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

// ======================================================
// COMPROBAR EMAIL EXISTENTE
// ======================================================
//
// excludeUserId se utiliza durante la edición.
// Permite conservar el email del propio usuario,
// pero impide utilizar el email de otro.
// ======================================================

exports.emailExists = async (
  email,
  excludeUserId = null
) => {
  let query;
  let values;

  if (excludeUserId !== null) {
    query = `
      SELECT id
      FROM usuarios
      WHERE email = ?
        AND id <> ?
      LIMIT 1
    `;

    values = [
      email,
      excludeUserId
    ];
  } else {
    query = `
      SELECT id
      FROM usuarios
      WHERE email = ?
      LIMIT 1
    `;

    values = [email];
  }

  const [rows] = await db.query(
    query,
    values
  );

  return rows.length > 0;
};


// ======================================================
// COMPROBAR ROL EXISTENTE
// ======================================================

exports.roleExists = async (roleId) => {
  const query = `
    SELECT id
    FROM roles
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(
    query,
    [roleId]
  );

  return rows.length > 0;
};