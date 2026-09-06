const express = require('express');
const router = express.Router();
const {generarQR} = require('../controllers/qrController');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

// ======================================================
// GENERAR CÓDIGO QR DINÁMICO
// ======================================================

router.get(
  '/generar',
  verifyToken,
  verifyPermission('GENERAR_QR'),
  generarQR
);

module.exports = router;