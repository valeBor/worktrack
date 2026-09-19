const express = require('express');
const controller = require('../controllers/asistencia-manual.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/registros',
  verifyPermission('VER_HISTORIAL_GESTIONADO'),
  controller.obtenerRegistros
);

router.use(verifyPermission('REGISTRAR_ASISTENCIA_MANUAL'));

router.patch(
  '/:asistenciaId/salida',
  controller.completarSalidaPendiente
);

router.post('/', controller.registrar);

router.get(
  '/usuarios-gestionables',
  controller.obtenerUsuariosGestionables
);

router.get(
  '/contexto/:usuarioId',
  controller.obtenerContexto
);

router.post('/', controller.registrar);

module.exports = router;