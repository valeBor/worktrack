const db = require('../config/db');

const bcrypt = require('bcrypt');

const authService =
  require('../services/authService');

const turnstileService =
  require('../services/turnstileService');

const emailService =
  require('../services/emailService');

const userModel =
  require('../models/userModel');


// ======================================================
// MENSAJE GENÉRICO DE RECUPERACIÓN
// ======================================================
//
// Debemos responder lo mismo independientemente
// de que el correo exista o no.
//
// Esto impide que alguien utilice el formulario
// para descubrir qué empleados están registrados.
// ======================================================

const mensajeRecuperacion =

  'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';


// ======================================================
// INICIAR SESIÓN
// ======================================================

exports.login = async (req, res) => {

  try {

    const {
      email,
      password,
      turnstileToken
    } = req.body;


    // --------------------------------------------------
    // 1. VALIDAR CAMPOS OBLIGATORIOS
    // --------------------------------------------------

    if (
      !email ||
      !password ||
      !turnstileToken
    ) {

      return res.status(400).json({

        message:
          'Email, contraseña y verificación son obligatorios'

      });

    }


    // --------------------------------------------------
    // 2. VERIFICAR TURNSTILE
    // --------------------------------------------------

    const turnstileValido =

      await turnstileService.verifyTurnstile(

        turnstileToken

      );


    if (!turnstileValido) {

      return res.status(400).json({

        message:
          'La verificación de seguridad es inválida o expiró'

      });

    }


    // --------------------------------------------------
    // 3. NORMALIZAR EMAIL
    // --------------------------------------------------

    const emailNormalizado =

      String(email)
        .trim()
        .toLowerCase();


    // --------------------------------------------------
    // 4. BUSCAR USUARIO
    // --------------------------------------------------

    const query = `
      SELECT
        u.*,
        r.nombre AS role
      FROM usuarios u
      JOIN roles r
        ON u.rol_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;


    const [results] = await db.query(

      query,

      [emailNormalizado]

    );


    if (results.length === 0) {

      return res.status(401).json({

        message: 'Credenciales inválidas'

      });

    }


    const user = results[0];


    // --------------------------------------------------
    // 5. VERIFICAR USUARIO ACTIVO
    // --------------------------------------------------

    if (Number(user.estado) !== 1) {

      return res.status(403).json({

        message:
          'El usuario se encuentra inactivo'

      });

    }


    // --------------------------------------------------
    // 6. COMPARAR CONTRASEÑA
    // --------------------------------------------------

    const validPassword =

      await bcrypt.compare(

        password,

        user.password

      );


    if (!validPassword) {

      return res.status(401).json({

        message: 'Credenciales inválidas'

      });

    }


    // --------------------------------------------------
    // 7. GENERAR TOKEN DE SESIÓN
    // --------------------------------------------------

    const token =

      authService.generateToken(user);


    // --------------------------------------------------
    // 8. RESPUESTA
    // --------------------------------------------------

    return res.status(200).json({

      message: 'Login OK',

      token,

      user: {

        id: user.id,

        nombre: user.nombre,

        apellido: user.apellido,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {

    console.error(

      'Error en login:',

      error.message

    );


    return res.status(500).json({

      message: 'Error interno del servidor'

    });

  }

};


// ======================================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ======================================================

exports.forgotPassword = async (req, res) => {

  try {

    const {
      email,
      turnstileToken
    } = req.body;


    // --------------------------------------------------
    // 1. VALIDAR DATOS
    // --------------------------------------------------

    if (!email || !turnstileToken) {

      return res.status(400).json({

        message:
          'El email y la verificación son obligatorios'

      });

    }


    // --------------------------------------------------
    // 2. VERIFICAR TURNSTILE
    // --------------------------------------------------

    const turnstileValido =

      await turnstileService.verifyTurnstile(

        turnstileToken

      );


    if (!turnstileValido) {

      return res.status(400).json({

        message:
          'La verificación de seguridad es inválida o expiró'

      });

    }


    // --------------------------------------------------
    // 3. NORMALIZAR EMAIL
    // --------------------------------------------------

    const emailNormalizado =

      String(email)
        .trim()
        .toLowerCase();


    // --------------------------------------------------
    // 4. BUSCAR USUARIO
    // --------------------------------------------------

    const user =

      await userModel.getByEmail(

        emailNormalizado

      );


    // Respondemos lo mismo si:
    //
    // - El correo no existe.
    // - El usuario está inactivo.
    //
    // En ninguno de estos casos enviamos un correo.
    if (
      !user ||
      Number(user.estado) !== 1
    ) {

      return res.status(200).json({

        message: mensajeRecuperacion

      });

    }


    // --------------------------------------------------
    // 5. GENERAR TOKEN DE RECUPERACIÓN
    // --------------------------------------------------

    const resetToken =

      authService.generateResetToken(user);


    // --------------------------------------------------
    // 6. CREAR ENLACE DE ANGULAR
    // --------------------------------------------------

    const frontendUrl =

      process.env.FRONTEND_URL;


    if (!frontendUrl) {

      throw new Error(

        'Falta configurar FRONTEND_URL en el archivo .env'

      );

    }


    const enlaceRecuperacion =

      `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;


    // --------------------------------------------------
    // 7. PREPARAR NOMBRE DEL USUARIO
    // --------------------------------------------------

    const nombreUsuario =

      `${user.nombre} ${user.apellido}`.trim();


    // --------------------------------------------------
    // 8. ENVIAR CORREO
    // --------------------------------------------------

    await emailService.enviarEmailRecuperacion(

      user.email,

      nombreUsuario,

      enlaceRecuperacion

    );


    // --------------------------------------------------
    // 9. RESPUESTA GENÉRICA
    // --------------------------------------------------

    return res.status(200).json({

      message: mensajeRecuperacion

    });

  } catch (error) {

    console.error(

      'Error en forgotPassword:',

      error.message

    );


    return res.status(500).json({

      message:
        'No se pudo procesar la solicitud de recuperación'

    });

  }

};


// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

exports.resetPassword = async (req, res) => {

  try {

    const {
      token,
      newPassword,
      confirmPassword
    } = req.body;


    // --------------------------------------------------
    // 1. VALIDAR CAMPOS OBLIGATORIOS
    // --------------------------------------------------

    if (
      !token ||
      !newPassword ||
      !confirmPassword
    ) {

      return res.status(400).json({

        message:
          'Todos los campos son obligatorios'

      });

    }


    // --------------------------------------------------
    // 2. COMPROBAR QUE COINCIDAN
    // --------------------------------------------------

    if (newPassword !== confirmPassword) {

      return res.status(400).json({

        message:
          'Las contraseñas no coinciden'

      });

    }


    // --------------------------------------------------
    // 3. VALIDAR LONGITUD
    // --------------------------------------------------

    if (
      newPassword.length < 8 ||
      newPassword.length > 64
    ) {

      return res.status(400).json({

        message:
          'La contraseña debe tener entre 8 y 64 caracteres'

      });

    }


    // --------------------------------------------------
    // 4. VALIDAR SEGURIDAD
    // --------------------------------------------------
    //
    // Debe contener:
    //
    // - Una letra minúscula.
    // - Una letra mayúscula.
    // - Un número.
    // --------------------------------------------------

    const passwordSegura =

      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;


    if (!passwordSegura.test(newPassword)) {

      return res.status(400).json({

        message:
          'La contraseña debe incluir mayúscula, minúscula y número'

      });

    }


    // --------------------------------------------------
    // 5. LEER EL ID DEL TOKEN
    // --------------------------------------------------
    //
    // decode todavía no valida la firma.
    //
    // Solamente necesitamos el ID para buscar
    // al usuario correspondiente.
    // --------------------------------------------------

    let tokenDecodificado;


    try {

      tokenDecodificado =

        authService.decodeResetToken(token);

    } catch (error) {

      return res.status(400).json({

        message:
          'El enlace es inválido o expiró. Solicitá uno nuevo.'

      });

    }


    // --------------------------------------------------
    // 6. BUSCAR USUARIO
    // --------------------------------------------------

    const user =

      await userModel.getById(

        tokenDecodificado.id

      );


    if (!user) {

      return res.status(400).json({

        message:
          'El enlace es inválido o expiró. Solicitá uno nuevo.'

      });

    }


    if (Number(user.estado) !== 1) {

      return res.status(403).json({

        message:
          'El usuario se encuentra inactivo'

      });

    }


    // --------------------------------------------------
    // 7. VERIFICAR FIRMA Y VENCIMIENTO
    // --------------------------------------------------

    try {

      authService.verifyResetToken(

        token,

        user

      );

    } catch (error) {

      return res.status(400).json({

        message:
          'El enlace es inválido, expiró o ya fue utilizado. Solicitá uno nuevo.'

      });

    }


    // --------------------------------------------------
    // 8. EVITAR REPETIR LA CONTRASEÑA ACTUAL
    // --------------------------------------------------

    const esLaMismaPassword =

      await bcrypt.compare(

        newPassword,

        user.password

      );


    if (esLaMismaPassword) {

      return res.status(400).json({

        message:
          'La contraseña nueva debe ser diferente de la actual'

      });

    }


    // --------------------------------------------------
    // 9. CREAR NUEVO HASH
    // --------------------------------------------------

    const nuevoHash =

      await bcrypt.hash(

        newPassword,

        10

      );


    // --------------------------------------------------
    // 10. ACTUALIZAR MYSQL
    // --------------------------------------------------

    const resultado =

      await userModel.updatePassword(

        user.id,

        nuevoHash

      );


    if (resultado.affectedRows !== 1) {

      throw new Error(

        'No se pudo actualizar la contraseña'

      );

    }


    // --------------------------------------------------
    // 11. RESPUESTA
    // --------------------------------------------------

    return res.status(200).json({

      message:
        'Contraseña actualizada correctamente'

    });

  } catch (error) {

    console.error(

      'Error en resetPassword:',

      error.message

    );


    return res.status(500).json({

      message:
        'Error interno del servidor'

    });

  }

};