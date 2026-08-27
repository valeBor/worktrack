const express = require('express');
const router = express.Router();

const horarioController = require('../controllers/horario.controller');

const {
  verifyToken
} = require('../middlewares/authMiddleware');

const {
  soloGestionHorarios
} = require('../middlewares/roleMiddleware');

// ======================================================
// MI HORARIO DE HOY
// ======================================================
//
// Todo usuario autenticado puede consultar su horario.
// ======================================================

router.get(
  '/mio/hoy',
  verifyToken,
  horarioController.getMiHorarioHoy
);

// ======================================================
// USUARIOS QUE EL ROL PUEDE ADMINISTRAR
// ======================================================
//
// admin      → usuarios habilitados para administración
// rrhh       → supervisores
// supervisor → empleados
// ======================================================

router.get(
  '/usuarios-gestionables',
  verifyToken,
  soloGestionHorarios,
  horarioController.getUsuariosGestionables
);

// ======================================================
// TODOS LOS HORARIOS PERMITIDOS
// ======================================================
//
// La respuesta se filtra en el backend según el rol.
// ======================================================

router.get(
  '/',
  verifyToken,
  soloGestionHorarios,
  horarioController.getHorarios
);

// ======================================================
// HORARIOS DE UN USUARIO
// ======================================================

router.get(
  '/usuario/:usuarioId',
  verifyToken,
  soloGestionHorarios,
  horarioController.getHorariosUsuario
);

// ======================================================
// CREAR CRONOGRAMA
// ======================================================

router.post(
  '/',
  verifyToken,
  soloGestionHorarios,
  horarioController.createHorario
);

// ======================================================
// REEMPLAZAR CRONOGRAMA COMPLETO DE UN USUARIO
// ======================================================
//
// Permite modificar días, horas, modalidad y tolerancia.
// ======================================================

router.put(
  '/usuario/:usuarioId',
  verifyToken,
  soloGestionHorarios,
  horarioController.updateCronogramaUsuario
);

// ======================================================
// ELIMINAR CRONOGRAMA COMPLETO DE UN USUARIO
// ======================================================

router.delete(
  '/usuario/:usuarioId',
  verifyToken,
  soloGestionHorarios,
  horarioController.deleteCronogramaUsuario
);

module.exports = router;