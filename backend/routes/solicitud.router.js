const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

// ======================================================
// MI HORARIO PARA UNA FECHA
// ======================================================

router.get(
  '/horario-fecha',
  verifyToken,
  verifyPermission('CREAR_SOLICITUD_CAMBIO'),
  solicitudController.getMiHorarioParaFecha
);

// ======================================================
// MIS SOLICITUDES
// ======================================================

router.get(
  '/mias',
  verifyToken,
  verifyPermission('VER_SOLICITUDES_PROPIAS'),
  solicitudController.getMisSolicitudes
);

// ======================================================
// CREAR SOLICITUD PROPIA
// ======================================================

router.post(
  '/',
  verifyToken,
  verifyPermission('CREAR_SOLICITUD_CAMBIO'),
  solicitudController.createSolicitud
);

// ======================================================
// OBTENER SOLICITUDES PENDIENTES
// ======================================================

router.get(
  '/pendientes',
  verifyToken,
  verifyPermission('VER_SOLICITUDES_PENDIENTES'),
  solicitudController.getSolicitudesPendientes
);

// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================

router.patch(
  '/:solicitudId/resolver',
  verifyToken,
  verifyPermission('RESOLVER_SOLICITUDES'),
  solicitudController.resolveSolicitud
);

module.exports = router;