const {
  rateLimit
} = require('express-rate-limit');


// ======================================================
// CONFIGURACIÓN GENERAL
// ======================================================

const QUINCE_MINUTOS =
  15 * 60 * 1000;


// ======================================================
// LÍMITE PARA LOGIN
// ======================================================
//
// Permite hasta 10 intentos fallidos
// desde una misma IP durante 15 minutos.
//
// Los inicios de sesión correctos no cuentan.
// ======================================================

exports.loginRateLimit = rateLimit({

  windowMs: QUINCE_MINUTOS,

  limit: 10,

  standardHeaders: 'draft-8',

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {

    message:

      'Demasiados intentos de inicio de sesión. Intentá nuevamente dentro de 15 minutos.'

  }

});


// ======================================================
// LÍMITE PARA SOLICITAR RECUPERACIÓN
// ======================================================
//
// Permite solicitar hasta 5 correos
// desde una misma IP cada 15 minutos.
// ======================================================

exports.forgotPasswordRateLimit = rateLimit({

  windowMs: QUINCE_MINUTOS,

  limit: 5,

  standardHeaders: 'draft-8',

  legacyHeaders: false,

  message: {

    message:

      'Se realizaron demasiadas solicitudes. Intentá nuevamente dentro de 15 minutos.'

  }

});


// ======================================================
// LÍMITE PARA RESTABLECER CONTRASEÑA
// ======================================================
//
// Permite hasta 10 intentos de cambio
// desde una misma IP cada 15 minutos.
// ======================================================

exports.resetPasswordRateLimit = rateLimit({

  windowMs: QUINCE_MINUTOS,

  limit: 10,

  standardHeaders: 'draft-8',

  legacyHeaders: false,

  message: {

    message:

      'Se realizaron demasiados intentos. Solicitá un enlace nuevo o esperá 15 minutos.'

  }

});