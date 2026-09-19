const db = require('../config/db');
const manualModel = require('../models/asistencia-manual.model');
const asistenciaModel = require('../models/asistencia.model');
const solicitudModel = require('../models/solicitud.model');
const {obtenerFechaHoraActual, horaASegundos} = require('../utils/fecha.util');
const {normalizarIp} = require('../utils/ip.util');

const CONTINGENCIAS = [
  'QR_NO_DISPONIBLE',
  'PROBLEMA_CONECTIVIDAD',
  'SIN_CELULAR',
  'FALLA_CAMARA_LECTOR',
  'OTRA'
];

function crearError(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function validarId(valor, nombre) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw crearError(`El ID de ${nombre} es inválido.`);
  }
  return id;
}

function validarHora(valor, nombre) {
  if (valor === null || valor === undefined || valor === '') return null;

  const hora = String(valor).trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(hora)) {
    throw crearError(`La ${nombre} no tiene un formato válido.`);
  }

  return hora.length === 5 ? `${hora}:00` : hora;
}

function validarContingencia(valor) {
  const contingencia = String(valor || '').trim().toUpperCase();
  if (!CONTINGENCIAS.includes(contingencia)) {
    throw crearError('Debe seleccionar una contingencia válida.');
  }
  return contingencia;
}

function validarMotivo(valor) {
  const motivo = String(valor || '').trim();
  if (motivo.length < 10 || motivo.length > 500) {
    throw crearError('El motivo debe tener entre 10 y 500 caracteres.');
  }
  return motivo;
}

async function obtenerHorarioAplicable(connection, usuarioId, fecha, diaSemana) {
  const cambio = await solicitudModel.getAprobadaByUsuarioAndFecha(
    connection, usuarioId, fecha
  );

  let horario;
  let origenHorario;
  let solicitudCambioId = null;

  if (cambio) {
    horario = {
      hora_entrada: cambio.hora_entrada_solicitada,
      hora_salida: cambio.hora_salida_solicitada,
      modalidad: cambio.modalidad_solicitada,
      tolerancia_minutos: cambio.tolerancia_actual
    };
    origenHorario = 'SOLICITUD_APROBADA';
    solicitudCambioId = cambio.id;
  } else {
    horario = await asistenciaModel.buscarHorarioParaFecha(
      connection, usuarioId, diaSemana, fecha
    );
    origenHorario = 'CRONOGRAMA_SEMANAL';
  }

  if (!horario) {
    throw crearError('El usuario no tiene un horario aplicable para hoy.', 409);
  }

  const modalidad = String(horario.modalidad || '').toUpperCase();
  const tolerancia = Number(horario.tolerancia_minutos);

  if (
    !['PRESENCIAL', 'HOME'].includes(modalidad) ||
    !Number.isInteger(tolerancia) ||
    tolerancia < 0 ||
    tolerancia > 240 ||
    !validarHora(horario.hora_entrada, 'hora programada de entrada') ||
    !validarHora(horario.hora_salida, 'hora programada de salida')
  ) {
    throw crearError('El horario aplicable contiene datos inválidos.', 500);
  }

  return {
    hora_entrada: horario.hora_entrada,
    hora_salida: horario.hora_salida,
    modalidad,
    tolerancia_minutos: tolerancia,
    origen_horario: origenHorario,
    solicitud_cambio_id: solicitudCambioId
  };
}

async function validarUsuarioGestionable(connection, actorId, usuarioId) {
  if (actorId === usuarioId) {
    throw crearError('No puede registrar su propia asistencia.', 403);
  }

  const usuario = await manualModel.getUsuarioGestionable(
    connection, actorId, usuarioId
  );

  if (!usuario) {
    throw crearError(
      'No puede registrar la asistencia de este usuario o está inactivo.',
      403
    );
  }

  return usuario;
}

exports.obtenerUsuariosGestionables = async actorId => {
  return manualModel.getUsuariosGestionables(
    validarId(actorId, 'usuario autenticado')
  );
};

exports.obtenerContexto = async (actorIdRecibido, usuarioIdRecibido) => {
  const actorId = validarId(actorIdRecibido, 'usuario autenticado');
  const usuarioId = validarId(usuarioIdRecibido, 'empleado');
  const {fecha, diaSemana} = obtenerFechaHoraActual();
  const connection = await db.getConnection();

  try {
    const usuario = await validarUsuarioGestionable(
      connection, actorId, usuarioId
    );
    const horario = await obtenerHorarioAplicable(
      connection, usuarioId, fecha, diaSemana
    );
    const asistencia = await asistenciaModel.buscarAsistenciaPorFecha(
      connection, usuarioId, fecha
    );

    return {
      fecha,
      usuario,
      horario,
      asistencia: asistencia ? {
        id: asistencia.id,
        hora_entrada: asistencia.hora_entrada,
        hora_salida: asistencia.hora_salida,
        tipo_asistencia: asistencia.tipo_asistencia,
        estado: asistencia.estado
      } : null,
      accion_disponible: !asistencia
        ? 'CREAR'
        : asistencia.hora_entrada && !asistencia.hora_salida
          ? 'COMPLETAR_SALIDA'
          : null
    };
  } finally {
    connection.release();
  }
};

exports.registrar = async ({
  actorId: actorIdRecibido,
  usuarioId: usuarioIdRecibido,
  fecha,
  horaEntrada: entradaRecibida,
  horaSalida: salidaRecibida,
  contingencia: contingenciaRecibida,
  motivo: motivoRecibido,
  ipActor
}) => {
  const actorId = validarId(actorIdRecibido, 'usuario autenticado');
  const usuarioId = validarId(usuarioIdRecibido, 'empleado');
  const horaEntrada = validarHora(entradaRecibida, 'hora de entrada');
  const horaSalida = validarHora(salidaRecibida, 'hora de salida');
  const contingencia = validarContingencia(contingenciaRecibida);
  const motivo = validarMotivo(motivoRecibido);

  if (typeof fecha !== 'string' || fecha !== obtenerFechaHoraActual().fecha) {
    throw crearError('El registro manual solo puede hacerse para el día de hoy.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await validarUsuarioGestionable(connection, actorId, usuarioId);

    const ahora = obtenerFechaHoraActual();
    if (ahora.fecha !== fecha) {
      throw crearError('La fecha cambió durante la operación. Intente nuevamente.');
    }

    const horario = await obtenerHorarioAplicable(
      connection, usuarioId, fecha, ahora.diaSemana
    );
    const asistencia = await manualModel.getAsistenciaParaActualizar(
      connection, usuarioId, fecha
    );

    const horaActual = horaASegundos(ahora.hora);
    if (
      (horaEntrada && horaASegundos(horaEntrada) > horaActual) ||
      (horaSalida && horaASegundos(horaSalida) > horaActual)
    ) {
      throw crearError('No se pueden registrar horas futuras.');
    }

    let asistenciaId;
    let accion;
    let entradaFinal;
    let salidaFinal;
    let estado;
    let estadoAnterior = null;
    let entradaAnterior = null;
    let salidaAnterior = null;
    let modalidad;

    if (!asistencia) {
      if (!horaEntrada) {
        throw crearError('La hora de entrada es obligatoria.');
      }
      if (horaSalida && horaASegundos(horaSalida) <= horaASegundos(horaEntrada)) {
        throw crearError('La salida debe ser posterior a la entrada.');
      }

      const limite = horaASegundos(horario.hora_entrada) +
        horario.tolerancia_minutos * 60;
      estado = horaASegundos(horaEntrada) <= limite ? 'PRESENTE' : 'TARDE';
      modalidad = horario.modalidad;

      asistenciaId = await manualModel.crearAsistencia(connection, {
        usuarioId,
        fecha,
        horaEntrada,
        horaSalida,
        modalidad,
        estado
      });

      accion = 'CREACION_MANUAL';
      entradaFinal = horaEntrada;
      salidaFinal = horaSalida;
    } else {
      if (!asistencia.hora_entrada || !['PRESENTE', 'TARDE'].includes(
        String(asistencia.estado || '').toUpperCase()
      )) {
        throw crearError('La asistencia existente requiere revisión.', 409);
      }
      if (asistencia.hora_salida) {
        throw crearError('La asistencia de hoy ya tiene entrada y salida.', 409);
      }
      if (!horaSalida) {
        throw crearError('Debe indicar la hora de salida faltante.');
      }

      entradaAnterior = String(asistencia.hora_entrada);
      if (horaEntrada && horaEntrada !== entradaAnterior) {
        throw crearError('No se puede modificar la entrada existente.', 409);
      }
      if (horaASegundos(horaSalida) <= horaASegundos(entradaAnterior)) {
        throw crearError('La salida debe ser posterior a la entrada.');
      }

      const actualizados = await manualModel.completarSalida(
        connection, asistencia.id, horaSalida
      );
      if (actualizados !== 1) {
        throw crearError('La salida ya fue registrada por otra operación.', 409);
      }

      asistenciaId = asistencia.id;
      accion = 'SALIDA_MANUAL';
      entradaFinal = entradaAnterior;
      salidaFinal = horaSalida;
      estadoAnterior = asistencia.estado;
      estado = asistencia.estado;
      modalidad = asistencia.tipo_asistencia;
    }

    await manualModel.crearAuditoria(connection, {
      asistencia_id: asistenciaId,
      usuario_id: usuarioId,
      realizado_por: actorId,
      accion,
      contingencia,
      motivo,
      fecha,
      hora_entrada_anterior: entradaAnterior,
      hora_salida_anterior: salidaAnterior,
      hora_entrada_nueva: entradaFinal,
      hora_salida_nueva: salidaFinal,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado,
      modalidad,
      horario_entrada: horario.hora_entrada,
      horario_salida: horario.hora_salida,
      tolerancia_minutos: horario.tolerancia_minutos,
      origen_horario: horario.origen_horario,
      solicitud_cambio_id: horario.solicitud_cambio_id,
      ip_actor: normalizarIp(ipActor).slice(0, 45) || null,
      registrada_en: `${ahora.fecha} ${ahora.hora}`
    });

    if (obtenerFechaHoraActual().fecha !== fecha) {
      throw crearError('La fecha cambió durante la operación. Intente nuevamente.');
    }

    await connection.commit();

    return {
      mensaje: accion === 'CREACION_MANUAL'
        ? 'Asistencia manual registrada correctamente.'
        : 'Salida manual registrada correctamente.',
      asistencia_id: asistenciaId,
      usuario_id: usuarioId,
      fecha,
      hora_entrada: entradaFinal,
      hora_salida: salidaFinal,
      tipo_asistencia: modalidad,
      estado,
      accion
    };
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      throw crearError('Ya existe una asistencia para este usuario y fecha.', 409);
    }
    throw error;
  } finally {
    connection.release();
  }
};
exports.obtenerRegistrosGestionables = async actorIdRecibido => {
  const actorId = validarId(actorIdRecibido, 'usuario autenticado');
  const rows = await manualModel.getRegistrosGestionables(actorId);
  const registros = new Map();

  for (const row of rows) {
    if (!registros.has(row.asistencia_id)) {
      registros.set(row.asistencia_id, {
        asistencia_id: row.asistencia_id,
        usuario: {
          id: row.usuario_id,
          nombre: row.usuario_nombre,
          apellido: row.usuario_apellido,
          role: row.usuario_role
        },
        fecha: row.fecha,
        hora_entrada: row.hora_entrada,
        hora_salida: row.hora_salida,
        tipo_asistencia: row.tipo_asistencia,
        estado: row.estado,
        origen_entrada: row.origen_entrada,
        origen_salida: row.origen_salida,
        eventos: []
      });
    }

    registros.get(row.asistencia_id).eventos.push({
      id: row.evento_id,
      accion: row.accion,
      contingencia: row.contingencia,
      motivo: row.motivo,
      realizado_por: row.realizado_por,
      responsable_nombre: row.responsable_nombre,
      responsable_apellido: row.responsable_apellido,
      registrada_en: row.registrada_en,
      hora_entrada_anterior: row.hora_entrada_anterior,
      hora_salida_anterior: row.hora_salida_anterior,
      hora_entrada_nueva: row.hora_entrada_nueva,
      hora_salida_nueva: row.hora_salida_nueva
    });
  }

  return [...registros.values()];
};

exports.completarSalidaPendiente = async ({
  actorId: actorIdRecibido,
  asistenciaId: asistenciaIdRecibido,
  horaSalida: salidaRecibida,
  contingencia: contingenciaRecibida,
  motivo: motivoRecibido,
  ipActor
}) => {
  const actorId = validarId(actorIdRecibido, 'usuario autenticado');
  const asistenciaId = validarId(asistenciaIdRecibido, 'asistencia');
  const horaSalida = validarHora(salidaRecibida, 'hora de salida');
  const contingencia = validarContingencia(contingenciaRecibida);
  const motivo = validarMotivo(motivoRecibido);

  if (!horaSalida) {
    throw crearError('Debe indicar la hora de salida.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const asistencia = await manualModel.getAsistenciaPorIdParaActualizar(
      connection,
      asistenciaId
    );

    if (!asistencia) {
      throw crearError('La asistencia indicada no existe.', 404);
    }

    await validarUsuarioGestionable(
      connection,
      actorId,
      Number(asistencia.usuario_id)
    );

    if (!asistencia.hora_entrada) {
      throw crearError(
        'La asistencia no tiene una hora de entrada registrada.',
        409
      );
    }

    if (asistencia.hora_salida) {
      throw crearError(
        'La asistencia ya tiene una hora de salida registrada.',
        409
      );
    }

    const ahora = obtenerFechaHoraActual();

    if (asistencia.fecha > ahora.fecha) {
      throw crearError(
        'No se puede completar una asistencia de una fecha futura.',
        409
      );
    }

    const horaEntrada = String(asistencia.hora_entrada);

    if (horaASegundos(horaSalida) <= horaASegundos(horaEntrada)) {
      throw crearError('La salida debe ser posterior a la entrada.');
    }

    if (
      asistencia.fecha === ahora.fecha &&
      horaASegundos(horaSalida) > horaASegundos(ahora.hora)
    ) {
      throw crearError('La hora de salida no puede ser futura.');
    }

    const contexto = await manualModel.getContextoAuditoria(
      connection,
      asistenciaId
    );

    if (!contexto) {
      throw crearError(
        'La asistencia no posee una auditoría manual de origen.',
        409
      );
    }

    const actualizados = await manualModel.completarSalida(
      connection,
      asistenciaId,
      horaSalida
    );

    if (actualizados !== 1) {
      throw crearError(
        'La salida ya fue registrada por otra operación.',
        409
      );
    }

    await manualModel.crearAuditoria(connection, {
      asistencia_id: asistenciaId,
      usuario_id: asistencia.usuario_id,
      realizado_por: actorId,
      accion: 'SALIDA_MANUAL',
      contingencia,
      motivo,
      fecha: asistencia.fecha,
      hora_entrada_anterior: horaEntrada,
      hora_salida_anterior: null,
      hora_entrada_nueva: horaEntrada,
      hora_salida_nueva: horaSalida,
      estado_anterior: asistencia.estado,
      estado_nuevo: asistencia.estado,
      modalidad: asistencia.tipo_asistencia,
      horario_entrada: contexto.horario_entrada,
      horario_salida: contexto.horario_salida,
      tolerancia_minutos: contexto.tolerancia_minutos,
      origen_horario: contexto.origen_horario,
      solicitud_cambio_id: contexto.solicitud_cambio_id,
      ip_actor: normalizarIp(ipActor).slice(0, 45) || null,
      registrada_en: `${ahora.fecha} ${ahora.hora}`
    });

    await connection.commit();

    return {
      mensaje: 'Salida manual registrada correctamente.',
      asistencia_id: asistenciaId,
      usuario_id: asistencia.usuario_id,
      fecha: asistencia.fecha,
      hora_entrada: horaEntrada,
      hora_salida: horaSalida,
      tipo_asistencia: asistencia.tipo_asistencia,
      estado: asistencia.estado,
      accion: 'SALIDA_MANUAL'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};