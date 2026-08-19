const express = require('express');
const router = express.Router();

const authController =
  require('../controllers/authController');


// ======================================================
// RUTAS DE AUTENTICACIÓN
// ======================================================


// Iniciar sesión.
router.post(

  '/login',

  authController.login

);


// Solicitar enlace para recuperar contraseña.
router.post(

  '/forgot-password',

  authController.forgotPassword

);


// Guardar una contraseña nueva utilizando
// el token recibido por correo.
router.post(

  '/reset-password',

  authController.resetPassword

);


module.exports = router;