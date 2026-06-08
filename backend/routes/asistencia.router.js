const express = require("express");
const router = express.Router();

const asistenciaController = require("../controllers/asistencia.controller");
const { verifyToken } = require("../middlewares/authMiddleware");


router.post(
  "/registrar",
  verifyToken,
  asistenciaController.registrar
);

module.exports = router;