const express = require('express');
const alertaController = require('../controllers/alerta.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.get(
  '/',
  verifyToken,
  verifyPermission('VER_ALERTAS'),
  alertaController.obtenerAlertas
);

module.exports = router;