const express = require("express");
const router = express.Router();

const asistenciaController =
  require("../controllers/asistencia.controller");

const {
  verifyToken
} = require("../middlewares/authMiddleware");


// ==========================================================
// MI ASISTENCIA DE HOY
// ==========================================================

router.get(
  "/mia/hoy",
  verifyToken,
  asistenciaController.obtenerMiAsistenciaHoy
);


// ==========================================================
// REGISTRAR ENTRADA / SALIDA
// ==========================================================

router.post(
  "/registrar",
  verifyToken,
  asistenciaController.registrar
);


module.exports = router;