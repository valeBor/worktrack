const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//metodo post - endpoint - envia datos para autenticación
router.post('/login', authController.login);

module.exports = router;