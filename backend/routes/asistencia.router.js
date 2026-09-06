const express = require('express');

const router = express.Router();

const asistenciaController = require(
  '../controllers/asistencia.controller'
);

const historialAsistenciaController = require(
  '../controllers/historial-asistencia.controller'
);

const {
  verifyToken
} = require('../middlewares/authMiddleware');

const {
  verifyPermission
} = require('../middlewares/permissionMiddleware');

// ======================================================
// MI ASISTENCIA DE HOY
// ======================================================

router.get(
  '/mia/hoy',
  verifyToken,
  asistenciaController.obtenerMiAsistenciaHoy
);

// ======================================================
// MI HISTORIAL DE ASISTENCIA
// Todos los roles con el permiso correspondiente.
// ======================================================

router.get(
  '/mia/historial',
  verifyToken,
  verifyPermission('VER_HISTORIAL_PROPIO'),
  historialAsistenciaController.obtenerMiHistorial
);

// ======================================================
// USUARIOS DISPONIBLES PARA EL HISTORIAL
//
// supervisor:
// Puede obtener usuarios con rol empleado.
//
// rrhh y admin:
// Pueden obtener todos los demás usuarios.
// ======================================================

router.get(
  '/historial/usuarios-gestionables',
  verifyToken,
  verifyPermission('VER_HISTORIAL_GESTIONADO'),
  historialAsistenciaController
    .obtenerUsuariosGestionables
);

// ======================================================
// HISTORIAL DE UN USUARIO
//
// El permiso permite ingresar al endpoint.
// El servicio valida que el usuario solicitado esté
// dentro del alcance jerárquico del actor.
// ======================================================

router.get(
  '/historial/usuario/:usuarioId',
  verifyToken,
  verifyPermission('VER_HISTORIAL_GESTIONADO'),
  historialAsistenciaController
    .obtenerHistorialUsuario
);

// ======================================================
// REGISTRAR ENTRADA O SALIDA
// ======================================================

router.post(
  '/registrar',
  verifyToken,
  asistenciaController.registrar
);

module.exports = router;