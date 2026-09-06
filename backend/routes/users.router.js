const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

// ======================================================
// OBTENER USUARIOS
// ======================================================

router.get(
  '/',
  verifyToken,
  verifyPermission('VER_USUARIOS'),
  userController.getUsers
);

// ======================================================
// CREAR USUARIO
// ======================================================

router.post(
  '/',
  verifyToken,
  verifyPermission('CREAR_USUARIOS'),
  userController.createUser
);

// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

router.put(
  '/:id',
  verifyToken,
  verifyPermission('EDITAR_USUARIOS'),
  userController.updateUser
);

// ======================================================
// ELIMINAR USUARIO
// ======================================================

router.delete(
  '/:id',
  verifyToken,
  verifyPermission('ELIMINAR_USUARIOS'),
  userController.deleteUser
);

module.exports = router;