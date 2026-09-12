const express = require('express');
const router = express.Router();

const reporteAsistenciaController = require(
  '../controllers/reporte-asistencia.controller'
);

const { verifyToken } = require('../middlewares/authMiddleware');
const {
  verifyPermission
} = require('../middlewares/permissionMiddleware');

// ======================================================
// PROTEGER TODAS LAS RUTAS DEL MÓDULO
// ======================================================

router.use(
  verifyToken,
  verifyPermission('VER_REPORTES_ASISTENCIA')
);

// ======================================================
// USUARIOS REPORTABLES
// ======================================================

router.get(
  '/usuarios',
  reporteAsistenciaController.obtenerUsuariosReportables
);

// ======================================================
// REPORTE DIARIO
// ======================================================

router.get(
  '/diario',
  reporteAsistenciaController.obtenerReporteDiario
);

// ======================================================
// HISTORIAL GLOBAL
// ======================================================

router.get(
  '/historial',
  reporteAsistenciaController.obtenerHistorial
);

// ======================================================
// ESTADÍSTICAS
// ======================================================

router.get(
  '/estadisticas',
  reporteAsistenciaController.obtenerEstadisticas
);

module.exports = router;