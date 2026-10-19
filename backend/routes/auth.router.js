const express = require('express');

const router = express.Router();


const authController =

  require('../controllers/authController');

const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyPermission } = require('../middlewares/permissionMiddleware');

router.post(
  '/activar-kiosco',
  verifyToken,
  verifyPermission('GENERAR_QR'),
  authController.activarKiosco
);


const {

  loginRateLimit,

  forgotPasswordRateLimit,

  resetPasswordRateLimit

} = require(

  '../middlewares/authRateLimit.middleware'

);


// ======================================================
// INICIAR SESIÓN
// ======================================================

router.post(

  '/login',

  loginRateLimit,

  authController.login

);


// ======================================================
// SOLICITAR RECUPERACIÓN
// ======================================================

router.post(

  '/forgot-password',

  forgotPasswordRateLimit,

  authController.forgotPassword

);


// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

router.post(

  '/reset-password',

  resetPasswordRateLimit,

  authController.resetPassword

);


module.exports = router;
