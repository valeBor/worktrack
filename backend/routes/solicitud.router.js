const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');
const {uploadJustificativo} = require('../middlewares/upload.middleware');

// ======================================================
// MI HORARIO PARA UNA FECHA
// ======================================================

router.get(
  '/horario-fecha',
  verifyToken,
  verifyPermission(
    'CREAR_SOLICITUD_CAMBIO'
  ),
  solicitudController.getMiHorarioParaFecha
);

// ======================================================
// MIS SOLICITUDES
// ======================================================

router.get(
  '/mias',
  verifyToken,
  verifyPermission(
    'VER_SOLICITUDES_PROPIAS'
  ),
  solicitudController.getMisSolicitudes
);

// ======================================================
// CREAR SOLICITUD DE CAMBIO DE HORARIO
// ======================================================

router.post(
  '/',
  verifyToken,
  verifyPermission(
    'CREAR_SOLICITUD_CAMBIO'
  ),
  solicitudController.createSolicitud
);

// ======================================================
// CREAR JUSTIFICACIÓN DE INASISTENCIA
// ======================================================

router.post(
  '/justificativos',
  verifyToken,
  verifyPermission(
    'CREAR_JUSTIFICATIVO_FALTA'
  ),
  uploadJustificativo,
  solicitudController.createJustificativo
);

// ======================================================
// OBTENER SOLICITUDES PENDIENTES
// ======================================================

router.get(
  '/pendientes',
  verifyToken,
  verifyPermission(
    'VER_SOLICITUDES_PENDIENTES'
  ),
  solicitudController.getSolicitudesPendientes
);

// ======================================================
// OBTENER SOLICITUDES GESTIONABLES
// ======================================================

router.get(
  '/gestionables',
  verifyToken,
  verifyPermission(
    'VER_SOLICITUDES_PENDIENTES'
  ),
  solicitudController.getSolicitudesGestionables
);

// ======================================================
// VISUALIZAR O DESCARGAR ARCHIVO PRIVADO
// ======================================================

router.get(
  '/archivos/:archivoId',
  verifyToken,
  verifyPermission(
    'VER_ARCHIVO_JUSTIFICATIVO'
  ),
  solicitudController.getArchivoJustificativo
);

// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================

router.patch(
  '/:solicitudId/resolver',
  verifyToken,
  verifyPermission(
    'RESOLVER_SOLICITUDES'
  ),
  solicitudController.resolveSolicitud
);

module.exports = router;