const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');
const {verifyToken} = require('../middlewares/authMiddleware');
const {verifyPermission} = require('../middlewares/permissionMiddleware');

// ======================================================
// MI HORARIO DE HOY
// ======================================================
//
// Todo usuario autenticado puede consultar
// únicamente su propio horario.
// ======================================================

router.get(
  '/mio/hoy',
  verifyToken,
  horarioController.getMiHorarioHoy
);

// ======================================================
// USUARIOS GESTIONABLES
// ======================================================
//
// El servicio determina qué usuarios puede
// administrar cada rol.
// ======================================================

router.get(
  '/usuarios-gestionables',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.getUsuariosGestionables
);

// ======================================================
// OBTENER HORARIOS PERMITIDOS
// ======================================================

router.get(
  '/',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.getHorarios
);

// ======================================================
// OBTENER HORARIOS DE UN USUARIO
// ======================================================

router.get(
  '/usuario/:usuarioId',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.getHorariosUsuario
);

// ======================================================
// CREAR CRONOGRAMA
// ======================================================

router.post(
  '/',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.createHorario
);

// ======================================================
// ACTUALIZAR CRONOGRAMA COMPLETO
// ======================================================

router.put(
  '/usuario/:usuarioId',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.updateCronogramaUsuario
);

// ======================================================
// FINALIZAR CRONOGRAMA COMPLETO
// ======================================================
//
// El cronograma no se elimina históricamente.
// El servicio cierra su vigencia.
// ======================================================

router.delete(
  '/usuario/:usuarioId',
  verifyToken,
  verifyPermission('GESTIONAR_HORARIOS'),
  horarioController.deleteCronogramaUsuario
);

module.exports = router;