const express = require('express');
const router = express.Router();
const {generarQR} = require('../controllers/qrController');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');
const {verifyKioskToken} = require('../middlewares/kioskMiddleware');

// ======================================================
// GENERAR CÓDIGO QR DINÁMICO
// ======================================================

router.get(
  '/generar',
  verifyToken,
  verifyPermission('GENERAR_QR'),
  generarQR
);

router.get('/generar-kiosco', verifyKioskToken, generarQR);

module.exports = router;
