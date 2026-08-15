const express = require('express');
const router = express.Router();

const horarioController =
  require('../controllers/horario.controller');

const {
  verifyToken
} = require('../middlewares/authMiddleware');

const {
  soloSupervisorAdmin
} = require('../middlewares/roleMiddleware');


// ======================================================
// MI HORARIO DE HOY
// ======================================================
//
// Cualquier usuario autenticado puede consultar
// SU propio horario.
//

router.get(
  '/mio/hoy',
  verifyToken,
  horarioController.getMiHorarioHoy
);


// ======================================================
// TODOS LOS HORARIOS
// ======================================================
//
// Solo Supervisor/Admin.
//

router.get(
  '/',
  verifyToken,
  soloSupervisorAdmin,
  horarioController.getHorarios
);


// ======================================================
// HORARIOS DE UN USUARIO
// ======================================================

router.get(
  '/usuario/:usuarioId',
  verifyToken,
  soloSupervisorAdmin,
  horarioController.getHorariosUsuario
);


// ======================================================
// CREAR HORARIO
// ======================================================

router.post(
  '/',
  verifyToken,
  soloSupervisorAdmin,
  horarioController.createHorario
);


// ======================================================
// MODIFICAR HORARIO
// ======================================================

router.put(
  '/:id',
  verifyToken,
  soloSupervisorAdmin,
  horarioController.updateHorario
);


// ======================================================
// ELIMINAR HORARIO
// ======================================================

router.delete(
  '/:id',
  verifyToken,
  soloSupervisorAdmin,
  horarioController.deleteHorario
);


module.exports = router;