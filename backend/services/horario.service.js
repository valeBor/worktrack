const db = require('../config/db');
const horarioModel = require('../models/horario.model');
const {obtenerFechaHoraActual, sumarDiasAFecha} = require('../utils/fecha.util');

// ======================================================
// CONSTANTES
// ======================================================

const DIAS_VALIDOS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
];

const ROLES_GESTIONABLES = {
  admin: [
    'admin',
    'rrhh',
    'supervisor',
    'empleado'
  ],
  rrhh: [
    'supervisor'
  ],
  supervisor: [
    'empleado'
  ]
};

// ======================================================
// CREAR ERROR
// ======================================================

function crearError(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

// ======================================================
// NORMALIZAR ROL
// ======================================================

function normalizarRol(role) {
  return String(role || '').trim().toLowerCase();
}

// ======================================================
// VALIDAR ID
// ======================================================

function validarId(id, nombre = 'usuario') {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw crearError(
      `El ID de ${nombre} es inválido.`,
      400
    );
  }

  return idNumerico;
}

// ======================================================
// OBTENER ACTOR ACTUAL DESDE LA BASE
// ======================================================

async function obtenerActor(actorToken) {
  const actorId = validarId(
    actorToken?.id,
    'usuario autenticado'
  );

  const actor = await horarioModel.getUsuarioConRol(
    actorId
  );

  if (!actor || !Boolean(actor.estado)) {
    throw crearError(
      'El usuario autenticado no existe o está inactivo.',
      401
    );
  }

  actor.role = normalizarRol(actor.role);

  if (!ROLES_GESTIONABLES[actor.role]) {
    throw crearError(
      'No tiene permisos para gestionar horarios.',
      403
    );
  }

  return actor;
}

// ======================================================
// VALIDAR USUARIO OBJETIVO
// ======================================================

async function validarUsuarioObjetivo(
  actor,
  usuarioId,
  requiereActivo = true
) {
  const objetivoId = validarId(usuarioId);

  const usuario = await horarioModel.getUsuarioConRol(
    objetivoId
  );

  if (!usuario) {
    throw crearError(
      'Usuario no encontrado.',
      404
    );
  }

  if (requiereActivo && !Boolean(usuario.estado)) {
    throw crearError(
      'No se puede asignar un horario a un usuario inactivo.',
      409
    );
  }

  const actorRole = normalizarRol(actor.role);
  const objetivoRole = normalizarRol(usuario.role);

  if (
    actorRole === 'supervisor' &&
    Number(actor.id) === Number(usuario.id)
  ) {
    throw crearError(
      'El supervisor no puede modificar su propio horario.',
      403
    );
  }

  const rolesPermitidos =
    ROLES_GESTIONABLES[actorRole] || [];

  if (!rolesPermitidos.includes(objetivoRole)) {
    throw crearError(
      'No tiene permisos para administrar el horario de este usuario.',
      403
    );
  }

  usuario.role = objetivoRole;

  return usuario;
}

// ======================================================
// VALIDAR FORMATO DE HORA
// ======================================================

function validarFormatoHora(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
    String(hora || '')
  );
}

// ======================================================
// NORMALIZAR Y VALIDAR HORARIO
// ======================================================

function validarHorario(datos) {
  if (!datos || typeof datos !== 'object') {
    throw crearError(
      'Los datos del cronograma son obligatorios.',
      400
    );
  }

  if (
    !Array.isArray(datos.dias_semana) ||
    datos.dias_semana.length === 0
  ) {
    throw crearError(
      'Debe seleccionar al menos un día.',
      400
    );
  }

  const dias = datos.dias_semana.map(
    (dia) => String(dia).trim().toLowerCase()
  );

  if (new Set(dias).size !== dias.length) {
    throw crearError(
      'No se pueden repetir días en el cronograma.',
      400
    );
  }

  for (const dia of dias) {
    if (!DIAS_VALIDOS.includes(dia)) {
      throw crearError(
        `Día inválido: ${dia}.`,
        400
      );
    }
  }

  if (!validarFormatoHora(datos.hora_entrada)) {
    throw crearError(
      'La hora de entrada es inválida.',
      400
    );
  }

  if (!validarFormatoHora(datos.hora_salida)) {
    throw crearError(
      'La hora de salida es inválida.',
      400
    );
  }

  if (datos.hora_entrada >= datos.hora_salida) {
    throw crearError(
      'La hora de salida debe ser posterior a la hora de entrada.',
      400
    );
  }

  const modalidad = String(
    datos.modalidad || ''
  ).trim().toUpperCase();

  if (
    modalidad !== 'PRESENCIAL' &&
    modalidad !== 'HOME'
  ) {
    throw crearError(
      'Modalidad inválida.',
      400
    );
  }

  const tolerancia = Number(
    datos.tolerancia_minutos ?? 0
  );

  if (
    !Number.isInteger(tolerancia) ||
    tolerancia < 0 ||
    tolerancia > 240
  ) {
    throw crearError(
      'La tolerancia debe ser un número entero entre 0 y 240 minutos.',
      400
    );
  }

  return {
    dias,
    hora_entrada: datos.hora_entrada,
    hora_salida: datos.hora_salida,
    tolerancia_minutos: tolerancia,
    modalidad
  };
}

// ======================================================
// INSERTAR DÍAS DEL CRONOGRAMA
// ======================================================

async function insertarCronograma(
  connection,
  usuarioId,
  horario,
  vigenteDesde
) {
  const horariosCreados = [];

  for (const dia of horario.dias) {
    const result = await horarioModel.create(
      connection,
      {
        usuario_id: usuarioId,
        dia_semana: dia,
        hora_entrada: horario.hora_entrada,
        hora_salida: horario.hora_salida,
        tolerancia_minutos:
          horario.tolerancia_minutos,
        modalidad: horario.modalidad,
        vigente_desde: vigenteDesde
      }
    );

    horariosCreados.push({
      id: result.insertId,
      dia_semana: dia,
      vigente_desde: vigenteDesde
    });
  }

  return horariosCreados;
}

// ======================================================
// CERRAR CRONOGRAMA ACTUAL
// ======================================================

async function cerrarCronogramaActual(
  connection,
  usuarioId,
  fechaActual
) {
  const fechaAnterior = sumarDiasAFecha(
    fechaActual,
    -1
  );

  if (!fechaAnterior) {
    throw crearError(
      'No fue posible calcular la fecha de cierre del cronograma.',
      500
    );
  }

  return horarioModel.cerrarCronogramaVigente(
    connection,
    usuarioId,
    fechaActual,
    fechaAnterior
  );
}

// ======================================================
// USUARIOS GESTIONABLES
// ======================================================

exports.getUsuariosGestionables = async (
  actorToken
) => {
  const actor = await obtenerActor(actorToken);

  return horarioModel.getUsuariosGestionables(
    ROLES_GESTIONABLES[actor.role]
  );
};

// ======================================================
// OBTENER HORARIOS PERMITIDOS
// ======================================================

exports.getHorarios = async (actorToken) => {
  const actor = await obtenerActor(actorToken);

  return horarioModel.getAllByRoles(
    ROLES_GESTIONABLES[actor.role]
  );
};

// ======================================================
// OBTENER HORARIOS DE UN USUARIO
// ======================================================

exports.getHorariosUsuario = async (
  actorToken,
  usuarioId
) => {
  const actor = await obtenerActor(actorToken);

  const usuario = await validarUsuarioObjetivo(
    actor,
    usuarioId,
    false
  );

  return horarioModel.getByUsuario(usuario.id);
};

// ======================================================
// OBTENER MI HORARIO DE HOY
// ======================================================

exports.getMiHorarioHoy = async (usuarioId) => {
  const id = validarId(usuarioId);

  const {
    fecha,
    diaSemana
  } = obtenerFechaHoraActual();

  const horario =
    await horarioModel.getByUsuarioAndDiaEnFecha(
      id,
      diaSemana,
      fecha
    );

  if (!horario) {
    throw crearError(
      'No tiene horario asignado para hoy.',
      404
    );
  }

  return horario;
};

// ======================================================
// CREAR CRONOGRAMA
// ======================================================

exports.createHorario = async (
  actorToken,
  datos
) => {
  const actor = await obtenerActor(actorToken);

  const usuario = await validarUsuarioObjetivo(
    actor,
    datos?.usuario_id
  );

  const horario = validarHorario(datos);

  const horariosExistentes =
    await horarioModel.getByUsuario(usuario.id);

  if (horariosExistentes.length > 0) {
    throw crearError(
      'El usuario ya tiene un cronograma asignado. Utilice la opción Editar.',
      409
    );
  }

  const {fecha} = obtenerFechaHoraActual();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const horariosCreados =
      await insertarCronograma(
        connection,
        usuario.id,
        horario,
        fecha
      );

    await connection.commit();

    return {
      mensaje: 'Cronograma creado correctamente.',
      cantidad: horariosCreados.length,
      vigente_desde: fecha,
      horarios: horariosCreados
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// ACTUALIZAR CRONOGRAMA COMPLETO
// ======================================================

exports.updateCronogramaUsuario = async (
  actorToken,
  usuarioId,
  datos
) => {
  const actor = await obtenerActor(actorToken);

  const usuario = await validarUsuarioObjetivo(
    actor,
    usuarioId
  );

  const horario = validarHorario(datos);

  const horariosExistentes =
    await horarioModel.getByUsuario(usuario.id);

  if (horariosExistentes.length === 0) {
    throw crearError(
      'El usuario no tiene un cronograma para modificar.',
      404
    );
  }

  const {fecha} = obtenerFechaHoraActual();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cierre = await cerrarCronogramaActual(
      connection,
      usuario.id,
      fecha
    );

    const horariosCreados =
      await insertarCronograma(
        connection,
        usuario.id,
        horario,
        fecha
      );

    await connection.commit();

    return {
      mensaje: 'Cronograma actualizado correctamente.',
      cantidad: horariosCreados.length,
      vigente_desde: fecha,
      cronograma_anterior: cierre,
      horarios: horariosCreados
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// ELIMINAR CRONOGRAMA COMPLETO
// ======================================================

exports.deleteCronogramaUsuario = async (
  actorToken,
  usuarioId
) => {
  const actor = await obtenerActor(actorToken);

  const usuario = await validarUsuarioObjetivo(
    actor,
    usuarioId,
    false
  );

  const horariosExistentes =
    await horarioModel.getByUsuario(usuario.id);

  if (horariosExistentes.length === 0) {
    throw crearError(
      'El usuario no tiene un cronograma para eliminar.',
      404
    );
  }

  const {fecha} = obtenerFechaHoraActual();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cierre = await cerrarCronogramaActual(
      connection,
      usuario.id,
      fecha
    );

    await connection.commit();

    return {
      mensaje: 'Cronograma eliminado correctamente.',
      cantidad:
        cierre.cerrados +
        cierre.eliminados,
      vigente_hasta:
        sumarDiasAFecha(fecha, -1)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};