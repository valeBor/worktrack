const express = require('express');
const router = express.Router();

const notificacionController = require(
  '../controllers/notificacion.controller'
);

const {
  verifyToken
} = require(
  '../middlewares/authMiddleware'
);

const {
  verifyPermission
} = require(
  '../middlewares/permissionMiddleware'
);

// ======================================================
// PROTEGER TODAS LAS RUTAS
// ======================================================

router.use(verifyToken);

// ======================================================
// CONTADOR DE NOTIFICACIONES NO LEÍDAS
// ======================================================

router.get(
  '/contador',
  verifyPermission(
    'VER_NOTIFICACIONES_PROPIAS'
  ),
  notificacionController
    .obtenerContador
);

// ======================================================
// OBTENER NOTIFICACIONES PROPIAS
// ======================================================

router.get(
  '/',
  verifyPermission(
    'VER_NOTIFICACIONES_PROPIAS'
  ),
  notificacionController
    .obtenerNotificaciones
);

// ======================================================
// MARCAR TODAS COMO LEÍDAS
// ======================================================

router.patch(
  '/leer-todas',
  verifyPermission(
    'MARCAR_NOTIFICACIONES_PROPIAS'
  ),
  notificacionController
    .marcarTodasComoLeidas
);

// ======================================================
// MARCAR UNA COMO LEÍDA
// ======================================================

router.patch(
  '/:notificacionId/leida',
  verifyPermission(
    'MARCAR_NOTIFICACIONES_PROPIAS'
  ),
  notificacionController
    .marcarComoLeida
);

module.exports = router;