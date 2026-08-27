const express = require('express');
const router = express.Router();
const solicitudController = require(
  '../controllers/solicitud.controller'
);

const {verifyToken} = require('../middlewares/authMiddleware');

const {verifyRole} = require('../middlewares/roleMiddleware');

// ======================================================
// MI HORARIO PARA UNA FECHA
// ======================================================
//
// El empleado selecciona una fecha futura
// y el backend obtiene su horario semanal.
//
// No se recibe usuario_id.
// ======================================================

router.get(
  '/horario-fecha',

  verifyToken,

  verifyRole(
    'empleado'
  ),

  solicitudController
    .getMiHorarioParaFecha
);


// ======================================================
// MIS SOLICITUDES
// ======================================================
//
// Solamente el empleado puede consultar
// sus propias solicitudes.
//
// El usuario se obtiene desde req.user.id.
// ======================================================

router.get(
  '/mias',

  verifyToken,

  verifyRole(
    'empleado'
  ),

  solicitudController
    .getMisSolicitudes
);


// ======================================================
// CREAR SOLICITUD
// ======================================================
//
// Solamente el empleado puede crear
// una solicitud propia.
//
// No se recibe usuario_id.
// ======================================================

router.post(
  '/',

  verifyToken,

  verifyRole(
    'empleado'
  ),

  solicitudController
    .createSolicitud
);


// ======================================================
// SOLICITUDES PENDIENTES
// ======================================================
//
// supervisor, rrhh y admin pueden
// consultar las solicitudes pendientes.
//
// Admin solamente puede consultarlas.
// ======================================================

router.get(
  '/pendientes',

  verifyToken,

  verifyRole(
    'supervisor',
    'rrhh',
    'admin'
  ),

  solicitudController
    .getSolicitudesPendientes
);


// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================
//
// Solamente supervisor y rrhh
// pueden resolver solicitudes.
// ======================================================

router.patch(
  '/:solicitudId/resolver',

  verifyToken,

  verifyRole(
    'supervisor',
    'rrhh'
  ),

  solicitudController
    .resolveSolicitud
);


module.exports = router;