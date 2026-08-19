const jwt = require('jsonwebtoken');


// ======================================================
// OBTENER SECRETO DEL LOGIN
// ======================================================

function obtenerJwtSecret() {

  const secret = process.env.JWT_SECRET;

  if (!secret) {

    throw new Error(
      'Falta configurar JWT_SECRET en el archivo .env'
    );

  }

  return secret;
}


// ======================================================
// OBTENER SECRETO PARA RECUPERAR CONTRASEÑA
// ======================================================
//
// Combinamos:
//
// 1. RESET_TOKEN_SECRET del .env.
// 2. El hash actual de la contraseña del usuario.
//
// El hash NO se guarda dentro del token.
//
// Cuando el usuario cambia su contraseña,
// cambia su hash y el token anterior deja de ser válido.
// ======================================================

function obtenerResetSecret(user) {

  const resetSecret =
    process.env.RESET_TOKEN_SECRET;

  if (!resetSecret) {

    throw new Error(
      'Falta configurar RESET_TOKEN_SECRET en el archivo .env'
    );

  }

  if (!user || !user.password) {

    throw new Error(
      'No se pudo generar el secreto de recuperación'
    );

  }

  return resetSecret + user.password;
}


// ======================================================
// GENERAR TOKEN DE INICIO DE SESIÓN
// ======================================================

exports.generateToken = (user) => {

  return jwt.sign(

    {
      id: user.id,
      role: user.role
    },

    obtenerJwtSecret(),

    {
      expiresIn: '8h'
    }

  );

};


// ======================================================
// GENERAR TOKEN PARA RECUPERAR CONTRASEÑA
// ======================================================

exports.generateResetToken = (user) => {

  return jwt.sign(

    {
      id: user.id,
      purpose: 'reset_password'
    },

    obtenerResetSecret(user),

    {
      expiresIn:
        process.env.RESET_TOKEN_EXPIRES || '15m'
    }

  );

};


// ======================================================
// LEER ID DEL TOKEN DE RECUPERACIÓN
// ======================================================
//
// jwt.decode solamente permite leer el contenido.
//
// IMPORTANTE:
// todavía NO confirma que el token sea válido.
//
// Usaremos este ID únicamente para buscar al usuario.
// Después verificaremos la firma con jwt.verify.
// ======================================================

exports.decodeResetToken = (token) => {

  const payload = jwt.decode(token);

  if (!payload || !payload.id) {

    throw new Error(
      'Token de recuperación inválido'
    );

  }

  return payload;

};


// ======================================================
// VERIFICAR TOKEN DE RECUPERACIÓN
// ======================================================

exports.verifyResetToken = (token, user) => {

  const payload = jwt.verify(

    token,

    obtenerResetSecret(user)

  );


  // Comprobamos que sea un token creado
  // específicamente para recuperar contraseña.
  if (payload.purpose !== 'reset_password') {

    throw new Error(
      'El token no es de recuperación'
    );

  }


  // También comprobamos que el token
  // pertenezca al usuario encontrado.
  if (Number(payload.id) !== Number(user.id)) {

    throw new Error(
      'El token no pertenece al usuario'
    );

  }


  return payload;

};