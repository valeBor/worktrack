const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');
const upload = require('../middlewares/upload.middleware');
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
// PENDIENTES Y RESUELTAS DURANTE EL DÍA
// ======================================================

router.get(
  '/gestionables',
  verifyToken,
  verifyPermission('VER_SOLICITUDES_PENDIENTES'),
  solicitudController.getSolicitudesGestionables
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
// ======================================================
// CREAR JUSTIFICATIVO DE FALTA
// ======================================================

router.post(
  '/justificativos',
  verifyToken,
  verifyPermission('CREAR_JUSTIFICATIVO_FALTA'),
  upload.single('archivo'),
  solicitudController.createJustificativo
);
module.exports = router;