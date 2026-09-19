const db = require('../config/db');
const solicitudModel = require('../models/solicitud.model');
const horarioModel = require('../models/horario.model');
const notificacionService = require('./notificacion.service');
const { validarArchivoJustificativo } = require('./archivo-justificativo.service');
const archivoStorageService = require('./archivo-storage.service');
const { obtenerFechaHoraActual, obtenerDiaSemanaDeFecha, horaASegundos
} = require('../utils/fecha.util');

// ======================================================
// CONSTANTES DE NEGOCIO
// ======================================================

const TIPO_CAMBIO_HORARIO = 'CAMBIO_HORARIO';
const TIPO_JUSTIFICACION_INASISTENCIA = 'JUSTIFICACION_INASISTENCIA';
const ROL_ADMIN = 'admin';
const ROL_RRHH = 'rrhh';
const ROL_SUPERVISOR = 'supervisor';
const ROL_EMPLEADO = 'empleado';

// ======================================================
// ERRORES
// ======================================================

function crearError(
  mensaje,
  statusCode = 400
) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

// ======================================================
// VALIDACIONES GENERALES
// ======================================================

function validarObjeto(
  valor,
  mensaje
) {
  if (
    !valor ||
    typeof valor !== 'object' ||
    Array.isArray(valor)
  ) {
    throw crearError(
      mensaje,
      400
    );
  }

  return valor;
}

function validarId(
  id,
  nombre = 'registro'
) {
  const idNumerico = Number(id);

  if (
    !Number.isInteger(idNumerico) ||
    idNumerico <= 0
  ) {
    throw crearError(
      `El ID de ${nombre} es inválido.`,
      400
    );
  }

  return idNumerico;
}

function normalizarRol(role) {
  return String(role || '')
    .trim()
    .toLowerCase();
}

function normalizarFechaBaseDatos(
  valor
) {
  if (!valor) {
    return '';
  }

  if (typeof valor === 'string') {
    return valor.substring(0, 10);
  }

  if (
    valor instanceof Date &&
    !Number.isNaN(valor.getTime())
  ) {
    const zonaHoraria =
      process.env.APP_TIMEZONE ||
      'America/Argentina/Buenos_Aires';

    return new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: zonaHoraria,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).format(valor);
  }

  return String(valor).substring(0, 10);
}

// ======================================================
// USUARIO AUTENTICADO
// ======================================================

async function obtenerActor(
  actorToken
) {
  const actorId = Number(
    actorToken?.id
  );

  if (
    !Number.isInteger(actorId) ||
    actorId <= 0
  ) {
    throw crearError(
      'Usuario no autenticado.',
      401
    );
  }

  const actor =
    await horarioModel
      .getUsuarioConRol(
        actorId
      );

  if (
    !actor ||
    !Boolean(actor.estado)
  ) {
    throw crearError(
      'El usuario autenticado no existe o está inactivo.',
      401
    );
  }

  actor.role = normalizarRol(
    actor.role
  );

  if (!actor.role) {
    throw crearError(
      'El usuario autenticado no tiene un rol válido.',
      403
    );
  }

  return actor;
}

// ======================================================
// VALIDAR HORAS
// ======================================================

function validarHora(
  hora,
  nombre,
  statusCode = 400
) {
  const valor = String(
    hora || ''
  ).trim();

  const formatoValido =
    /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
      .test(valor);

  if (!formatoValido) {
    throw crearError(
      `${nombre} es inválida.`,
      statusCode
    );
  }

  return valor.length === 5
    ? `${valor}:00`
    : valor;
}

// ======================================================
// VALIDAR MODALIDAD
// ======================================================

function validarModalidad(
  modalidad,
  nombre,
  statusCode = 400
) {
  const valor = String(
    modalidad || ''
  )
    .trim()
    .toUpperCase();

  if (
    valor !== 'PRESENCIAL' &&
    valor !== 'HOME'
  ) {
    throw crearError(
      `${nombre} debe ser PRESENCIAL o HOME.`,
      statusCode
    );
  }

  return valor;
}

// ======================================================
// VALIDAR FECHA SOLICITADA
// ======================================================

function validarFechaSolicitada(
  fechaSolicitada
) {
  const fecha = String(
    fechaSolicitada || ''
  ).trim();

  const diaSemana =
    obtenerDiaSemanaDeFecha(
      fecha
    );

  if (!diaSemana) {
    throw crearError(
      'La fecha solicitada es inválida.',
      400
    );
  }

  const {
    fecha: fechaActual
  } = obtenerFechaHoraActual();

  if (fecha <= fechaActual) {
    throw crearError(
      'La fecha solicitada debe ser posterior a la fecha actual.',
      400
    );
  }

  return {
    fecha,
    diaSemana
  };
}

// ======================================================
// VALIDAR MOTIVO
// ======================================================

function validarMotivo(motivo) {
  const valor = String(
    motivo || ''
  ).trim();

  if (valor.length < 5) {
    throw crearError(
      'El motivo debe contener al menos 5 caracteres.',
      400
    );
  }

  if (valor.length > 500) {
    throw crearError(
      'El motivo no puede superar los 500 caracteres.',
      400
    );
  }

  return valor;
}

// ======================================================
// VALIDAR JUSTIFICACIÓN DE INASISTENCIA
// ======================================================

function validarFechaInasistencia(
  fechaInasistencia
) {
  const fecha = String(
    fechaInasistencia || ''
  ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !obtenerDiaSemanaDeFecha(fecha)
  ) {
    throw crearError(
      'La fecha de la inasistencia es inválida.',
      400
    );
  }

  const {
    fecha: fechaActual
  } = obtenerFechaHoraActual();

  if (fecha > fechaActual) {
    throw crearError(
      'No se puede justificar una inasistencia futura.',
      400
    );
  }

  return fecha;
}

function validarCodigoJustificativo(
  codigo
) {
  const valor = String(
    codigo || ''
  )
    .trim()
    .toUpperCase();

  if (
    !valor ||
    valor.length > 50 ||
    !/^[A-Z0-9_]+$/.test(valor)
  ) {
    throw crearError(
      'El tipo de justificativo es inválido.',
      400
    );
  }

  return valor;
}

function validarDatosJustificativo(
  datos
) {
  validarObjeto(
    datos,
    'Los datos del justificativo son obligatorios.'
  );

  const camposControlados = [
    'usuario_id',
    'tipo',
    'estado',
    'tipo_justificativo_id',
    'resuelto_por',
    'resuelta_en'
  ];

  const campoNoPermitido =
    camposControlados.find(
      campo =>
        Object.prototype
          .hasOwnProperty.call(
            datos,
            campo
          )
    );

  if (campoNoPermitido) {
    throw crearError(
      `El campo ${campoNoPermitido} es administrado por el servidor.`,
      400
    );
  }

  return {
    fecha_inasistencia:
      validarFechaInasistencia(
        datos.fecha_inasistencia
      ),

    tipo_justificativo_codigo:
      validarCodigoJustificativo(
        datos.tipo_justificativo
      ),

    motivo:
      validarMotivo(
        datos.motivo ??
        datos.descripcion
      )
  };
}

// ======================================================
// VALIDAR RESPUESTA
// ======================================================

function validarRespuesta(
  estado,
  respuesta
) {
  const valor = String(
    respuesta || ''
  ).trim();

  if (
    estado === 'RECHAZADA' &&
    valor.length < 5
  ) {
    throw crearError(
      'Debe indicar el motivo del rechazo con al menos 5 caracteres.',
      400
    );
  }

  if (valor.length > 500) {
    throw crearError(
      'La respuesta no puede superar los 500 caracteres.',
      400
    );
  }

  return valor || null;
}

// ======================================================
// VALIDAR HORARIO OBTENIDO DE LA BASE
// ======================================================

function validarHorarioActual(
  horario
) {
  const horaEntrada =
    validarHora(
      horario?.hora_entrada,
      'La hora de entrada del horario asignado',
      409
    );

  const horaSalida =
    validarHora(
      horario?.hora_salida,
      'La hora de salida del horario asignado',
      409
    );

  if (
    horaASegundos(horaEntrada) >=
    horaASegundos(horaSalida)
  ) {
    throw crearError(
      'El horario asignado al usuario es inconsistente.',
      409
    );
  }

  const modalidad =
    validarModalidad(
      horario?.modalidad,
      'La modalidad del horario asignado',
      409
    );

  const tolerancia = Number(
    horario?.tolerancia_minutos
  );

  if (
    !Number.isInteger(tolerancia) ||
    tolerancia < 0 ||
    tolerancia > 240
  ) {
    throw crearError(
      'La tolerancia del horario asignado es inválida.',
      409
    );
  }

  return {
    horaEntrada,
    horaSalida,
    modalidad,
    tolerancia
  };
}

// ======================================================
// VALIDAR CREACIÓN
// ======================================================

function validarDatosCreacion(
  datos
) {
  validarObjeto(
    datos,
    'Los datos de la solicitud son obligatorios.'
  );

  const camposControlados = [
    'usuario_id',
    'tipo',
    'estado',
    'hora_entrada_actual',
    'hora_salida_actual',
    'modalidad_actual',
    'tolerancia_actual',
    'respuesta',
    'resuelto_por',
    'resuelta_en'
  ];

  const campoNoPermitido =
    camposControlados.find(
      campo =>
        Object.prototype
          .hasOwnProperty.call(
            datos,
            campo
          )
    );

  if (campoNoPermitido) {
    throw crearError(
      `El campo ${campoNoPermitido} es administrado por el servidor.`,
      400
    );
  }

  const {
    fecha,
    diaSemana
  } = validarFechaSolicitada(
    datos.fecha_solicitada
  );

  const horaEntrada =
    validarHora(
      datos
        .hora_entrada_solicitada,
      'La hora de entrada solicitada'
    );

  const horaSalida =
    validarHora(
      datos
        .hora_salida_solicitada,
      'La hora de salida solicitada'
    );

  const modalidadSolicitada =
    validarModalidad(
      datos.modalidad_solicitada,
      'La modalidad solicitada'
    );

  if (
    horaASegundos(horaEntrada) >=
    horaASegundos(horaSalida)
  ) {
    throw crearError(
      'La hora de salida solicitada debe ser posterior a la hora de entrada.',
      400
    );
  }

  return {
    fecha,
    diaSemana,
    hora_entrada_solicitada:
      horaEntrada,
    hora_salida_solicitada:
      horaSalida,
    modalidad_solicitada:
      modalidadSolicitada,
    motivo:
      validarMotivo(
        datos.motivo
      )
  };
}

// ======================================================
// VALIDAR RESOLUCIÓN
// ======================================================

function validarDatosResolucion(
  datos
) {
  validarObjeto(
    datos,
    'Los datos para resolver la solicitud son obligatorios.'
  );

  const estado = String(
    datos.estado || ''
  )
    .trim()
    .toUpperCase();

  if (
    estado !== 'APROBADA' &&
    estado !== 'RECHAZADA'
  ) {
    throw crearError(
      'El estado debe ser APROBADA o RECHAZADA.',
      400
    );
  }

  return {
    estado,
    respuesta:
      validarRespuesta(
        estado,
        datos.respuesta
      )
  };
}

// ======================================================
// JERARQUÍA PARA RESOLVER SOLICITUDES
// ======================================================

function validarJerarquiaResolucion(
  responsable,
  solicitante,
  solicitud
) {
  if (
    Number(responsable.id) ===
    Number(solicitud.usuario_id)
  ) {
    throw crearError(
      'No puede resolver su propia solicitud.',
      403
    );
  }

  const rolResponsable =
    normalizarRol(
      responsable.role
    );

  const rolSolicitante =
    normalizarRol(
      solicitante.role
    );

  if (
    rolSolicitante ===
    ROL_EMPLEADO
  ) {
    const puedeResolver =
      rolResponsable ===
      ROL_SUPERVISOR ||
      rolResponsable ===
      ROL_RRHH;

    if (!puedeResolver) {
      throw crearError(
        'La solicitud de un empleado solo puede ser resuelta por supervisor o RRHH.',
        403
      );
    }

    return;
  }

  if (
    rolSolicitante ===
    ROL_SUPERVISOR
  ) {
    if (
      rolResponsable !==
      ROL_RRHH
    ) {
      throw crearError(
        'La solicitud de un supervisor solamente puede ser resuelta por RRHH.',
        403
      );
    }

    return;
  }

  throw crearError(
    'El rol actual del solicitante no permite resolver esta solicitud.',
    409
  );
}

// ======================================================
// CREAR SOLICITUD
// ======================================================

exports.createSolicitud = async (
  actorToken,
  datos
) => {
  const actor =
    await obtenerActor(
      actorToken
    );

  const solicitudValidada =
    validarDatosCreacion(
      datos
    );

  const horario =
    await horarioModel
      .getByUsuarioAndDiaEnFecha(
        actor.id,
        solicitudValidada
          .diaSemana,
        solicitudValidada.fecha
      );

  if (!horario) {
    throw crearError(
      'No tiene un horario asignado para la fecha seleccionada.',
      404
    );
  }

  const horarioActual =
    validarHorarioActual(
      horario
    );

  const mismaConfiguracion =
    horaASegundos(
      horarioActual.horaEntrada
    ) ===
    horaASegundos(
      solicitudValidada
        .hora_entrada_solicitada
    ) &&
    horaASegundos(
      horarioActual.horaSalida
    ) ===
    horaASegundos(
      solicitudValidada
        .hora_salida_solicitada
    ) &&
    horarioActual.modalidad ===
    solicitudValidada
      .modalidad_solicitada;

  if (mismaConfiguracion) {
    throw crearError(
      'El horario y la modalidad solicitados son iguales a los actuales.',
      400
    );
  }

  const connection =
    await db.getConnection();

  try {
    await connection
      .beginTransaction();

    const solicitudActiva =
      await solicitudModel
        .getActivaByUsuarioAndFecha(
          connection,
          actor.id,
          solicitudValidada.fecha
        );

    if (solicitudActiva) {
      const mensaje =
        solicitudActiva.estado ===
          'APROBADA'
          ? 'Ya existe un cambio de horario aprobado para esa fecha.'
          : 'Ya existe una solicitud pendiente para esa fecha.';

      throw crearError(
        mensaje,
        409
      );
    }

    const nuevaSolicitud = {
      usuario_id: actor.id,
      tipo:
        TIPO_CAMBIO_HORARIO,
      estado: 'PENDIENTE',
      fecha_solicitada:
        solicitudValidada.fecha,
      hora_entrada_actual:
        horarioActual.horaEntrada,
      hora_salida_actual:
        horarioActual.horaSalida,
      modalidad_actual:
        horarioActual.modalidad,
      tolerancia_actual:
        horarioActual.tolerancia,
      hora_entrada_solicitada:
        solicitudValidada
          .hora_entrada_solicitada,
      hora_salida_solicitada:
        solicitudValidada
          .hora_salida_solicitada,
      modalidad_solicitada:
        solicitudValidada
          .modalidad_solicitada,
      motivo:
        solicitudValidada.motivo
    };

    const result =
      await solicitudModel.create(
        connection,
        nuevaSolicitud
      );

    await notificacionService
      .notificarSolicitudCreada(
        connection,
        {
          solicitudId:
            result.insertId,
          solicitante: actor,
          fechaSolicitada:
            nuevaSolicitud
              .fecha_solicitada,
          tipo: nuevaSolicitud.tipo
        }
      );

    await connection.commit();

    return {
      mensaje:
        'Solicitud de cambio de horario enviada correctamente.',
      solicitud: {
        id: result.insertId,
        ...nuevaSolicitud
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// CREAR JUSTIFICACIÓN DE INASISTENCIA
// ======================================================

exports.createJustificativo = async (
  actorToken,
  datos,
  archivo
) => {
  const actor =
    await obtenerActor(
      actorToken
    );

  if (
    actor.role !== ROL_EMPLEADO &&
    actor.role !== ROL_SUPERVISOR
  ) {
    throw crearError(
      'Su rol no puede presentar justificativos de inasistencia.',
      403
    );
  }

  const datosValidados =
    validarDatosJustificativo(
      datos
    );

  const connection =
    await db.getConnection();

  let archivoGuardado = null;
  let transaccionIniciada = false;

  try {
    await connection.beginTransaction();
    transaccionIniciada = true;

    const tipoJustificativo =
      await solicitudModel
        .getTipoJustificativoByCodigo(
          connection,
          datosValidados
            .tipo_justificativo_codigo
        );

    if (!tipoJustificativo) {
      throw crearError(
        'El tipo de justificativo no existe o está inactivo.',
        400
      );
    }

    const requiereArchivo =
      Boolean(
        tipoJustificativo
          .requiere_archivo
      );

    if (
      requiereArchivo &&
      !archivo
    ) {
      throw crearError(
        'El tipo de justificativo seleccionado requiere adjuntar un certificado.',
        400
      );
    }

    const archivoValidado =
      archivo
        ? validarArchivoJustificativo(
          archivo
        )
        : null;

    const solicitudActiva =
      await solicitudModel
        .getJustificacionActivaByUsuarioAndFecha(
          connection,
          actor.id,
          datosValidados
            .fecha_inasistencia
        );

    if (solicitudActiva) {
      const mensaje =
        solicitudActiva.estado ===
          'APROBADA'
          ? 'Ya existe una justificación aprobada para esa fecha.'
          : 'Ya existe una justificación pendiente para esa fecha.';

      throw crearError(
        mensaje,
        409
      );
    }

    const nuevoJustificativo = {
      usuario_id: actor.id,
      motivo:
        datosValidados.motivo,
      fecha_inasistencia:
        datosValidados
          .fecha_inasistencia,
      tipo_justificativo_id:
        tipoJustificativo.id
    };

    const result =
      await solicitudModel
        .createJustificativo(
          connection,
          nuevoJustificativo
        );

    let archivoRespuesta = null;

    if (archivoValidado) {
      archivoGuardado =
        await archivoStorageService
          .saveFile(
            archivoValidado
          );

      const archivoResult =
        await solicitudModel
          .createArchivo(
            connection,
            {
              solicitud_id:
                result.insertId,
              storage_provider:
                archivoGuardado
                  .provider,
              storage_key:
                archivoGuardado
                  .storageKey,
              nombre_original:
                archivoValidado
                  .originalName,
              mime_type:
                archivoValidado
                  .mimeType,
              extension:
                archivoValidado
                  .extension,
              tamanio_bytes:
                archivoValidado
                  .size,
              sha256:
                archivoValidado
                  .sha256,
              creado_por:
                actor.id
            }
          );

      archivoRespuesta = {
        id: archivoResult.insertId,
        nombre_original:
          archivoValidado
            .originalName,
        mime_type:
          archivoValidado
            .mimeType,
        tamanio_bytes:
          archivoValidado
            .size
      };
    }

    await notificacionService
      .notificarSolicitudCreada(
        connection,
        {
          solicitudId:
            result.insertId,
          solicitante: actor,
          fechaSolicitada:
            nuevoJustificativo
              .fecha_inasistencia,
          tipo:
            TIPO_JUSTIFICACION_INASISTENCIA
        }
      );

    await connection.commit();

    return {
      mensaje:
        'Justificación de inasistencia enviada correctamente.',
      solicitud: {
        id: result.insertId,
        tipo:
          TIPO_JUSTIFICACION_INASISTENCIA,
        estado: 'PENDIENTE',
        fecha_inasistencia:
          nuevoJustificativo
            .fecha_inasistencia,
        tipo_justificativo: {
          id:
            tipoJustificativo.id,
          codigo:
            tipoJustificativo.codigo,
          nombre:
            tipoJustificativo.nombre
        },
        motivo:
          nuevoJustificativo.motivo,
        archivo:
          archivoRespuesta
      }
    };
  } catch (error) {
    if (transaccionIniciada) {
      await connection.rollback();
    }

    if (archivoGuardado) {
      try {
        await archivoStorageService
          .deleteFile(
            archivoGuardado.provider,
            archivoGuardado.storageKey
          );
      } catch (deleteError) {
        console.error(
          'No se pudo eliminar el archivo luego de revertir la solicitud:',
          deleteError
        );
      }
    }

    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// OBTENER MI HORARIO PARA UNA FECHA
// ======================================================

exports.getMiHorarioParaFecha =
  async (
    actorToken,
    fechaSolicitada
  ) => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const {
      fecha,
      diaSemana
    } = validarFechaSolicitada(
      fechaSolicitada
    );

    const horario =
      await horarioModel
        .getByUsuarioAndDiaEnFecha(
          actor.id,
          diaSemana,
          fecha
        );

    if (!horario) {
      throw crearError(
        'No tiene un horario asignado para la fecha seleccionada.',
        404
      );
    }

    const horarioActual =
      validarHorarioActual(
        horario
      );

    return {
      fecha_solicitada: fecha,
      dia_semana: diaSemana,
      horario_actual: {
        hora_entrada:
          horarioActual.horaEntrada,
        hora_salida:
          horarioActual.horaSalida,
        modalidad:
          horarioActual.modalidad,
        tolerancia_minutos:
          horarioActual.tolerancia
      }
    };
  };

// ======================================================
// OBTENER MIS SOLICITUDES
// ======================================================

exports.getMisSolicitudes =
  async actorToken => {
    const actor =
      await obtenerActor(
        actorToken
      );

    return solicitudModel
      .getByUsuario(
        actor.id
      );
  };

// ======================================================
// OBTENER SOLICITUDES PENDIENTES
// ======================================================

exports.getSolicitudesPendientes =
  async actorToken => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const solicitudes =
      await solicitudModel
        .getPendientes();

    if (
      actor.role ===
      ROL_SUPERVISOR
    ) {
      return solicitudes.filter(
        solicitud =>
          normalizarRol(
            solicitud.usuario_role
          ) === ROL_EMPLEADO
      );
    }

    if (
      actor.role === ROL_RRHH ||
      actor.role === ROL_ADMIN
    ) {
      return solicitudes;
    }

    throw crearError(
      'No tiene autorización para consultar solicitudes pendientes.',
      403
    );
  };

// ======================================================
// SOLICITUDES PENDIENTES Y RESUELTAS
// ======================================================

exports.getSolicitudesGestionables =
  async actorToken => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const solicitudes =
      await solicitudModel
        .getGestionables();

    if (
      actor.role ===
      ROL_SUPERVISOR
    ) {
      return solicitudes.filter(
        solicitud =>
          normalizarRol(
            solicitud.usuario_role
          ) === ROL_EMPLEADO
      );
    }

    if (
      actor.role === ROL_RRHH ||
      actor.role === ROL_ADMIN
    ) {
      return solicitudes.filter(
        solicitud =>
          [
            ROL_EMPLEADO,
            ROL_SUPERVISOR
          ].includes(
            normalizarRol(
              solicitud.usuario_role
            )
          )
      );
    }

    throw crearError(
      'No tiene autorización para consultar estas solicitudes.',
      403
    );
  };

// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================

exports.resolveSolicitud = async (
  actorToken,
  solicitudId,
  datos
) => {
  const responsable =
    await obtenerActor(
      actorToken
    );

  const id = validarId(
    solicitudId,
    'solicitud'
  );

  const {
    estado,
    respuesta
  } = validarDatosResolucion(
    datos
  );

  const connection =
    await db.getConnection();

  try {
    await connection
      .beginTransaction();

    const solicitud =
      await solicitudModel
        .getByIdForUpdate(
          connection,
          id
        );

    if (!solicitud) {
      throw crearError(
        'Solicitud no encontrada.',
        404
      );
    }
    if (
      solicitud.tipo !== TIPO_CAMBIO_HORARIO &&
      solicitud.tipo !== TIPO_JUSTIFICACION_INASISTENCIA
    ) {

      throw crearError(
        'Tipo de solicitud no soportado.',
        409
      );
    }
    if (
      solicitud.estado !==
      'PENDIENTE'
    ) {
      throw crearError(
        'La solicitud ya fue resuelta.',
        409
      );
    }

    const solicitante =
      await horarioModel
        .getUsuarioConRol(
          solicitud.usuario_id
        );

    if (!solicitante) {
      throw crearError(
        'No se pudo obtener el usuario que realizó la solicitud.',
        409
      );
    }

    solicitante.role =
      normalizarRol(
        solicitante.role
      );

    validarJerarquiaResolucion(
      responsable,
      solicitante,
      solicitud
    );

    const fechaSolicitada =
      normalizarFechaBaseDatos(
        solicitud.tipo ===
          TIPO_JUSTIFICACION_INASISTENCIA
          ? solicitud.fecha_inasistencia
          : solicitud.fecha_solicitada
      );
    const {
      fecha,
      hora
    } = obtenerFechaHoraActual();

    if (estado === 'APROBADA') {
      if (
        !Boolean(
          solicitante.estado
        )
      ) {
        throw crearError(
          'No se puede aprobar la solicitud porque el usuario está inactivo.',
          409
        );
      }

      if (
        solicitud.tipo === TIPO_CAMBIO_HORARIO &&
        (!fechaSolicitada || fechaSolicitada <= fecha)
      ) {
        throw crearError(
          'No se puede aprobar una solicitud cuya fecha ya llegó o pasó.',
          409
        );
      }
    }

    const fechaResolucion =
      `${fecha} ${hora}`;

    const result =
      await solicitudModel.resolve(
        connection,
        id,
        estado,
        respuesta,
        responsable.id,
        fechaResolucion
      );

    if (
      result.affectedRows !== 1
    ) {
      throw crearError(
        'La solicitud no pudo ser resuelta.',
        409
      );
    }

    await notificacionService
      .notificarSolicitudResuelta(
        connection,
        {
          solicitudId: id,
          solicitante,
          responsable,
          estado,
          fechaSolicitada,
          resueltaEn:
            fechaResolucion,
          tipo: solicitud.tipo
        }
      );

    await connection.commit();

    return {
      mensaje:
        estado === 'APROBADA'
          ? 'Solicitud aprobada correctamente.'
          : 'Solicitud rechazada correctamente.',
      solicitud: {
        id,
        estado,
        respuesta,
        resuelto_por:
          responsable.id,
        responsable: {
          nombre:
            responsable.nombre,
          apellido:
            responsable.apellido,
          role:
            responsable.role
        },
        resuelta_en:
          fechaResolucion
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// OBTENER ARCHIVO PRIVADO DE UNA JUSTIFICACIÓN
// ======================================================

exports.obtenerArchivoJustificativo = async (
  actorToken,
  archivoId,
  accion,
  ipActor
) => {
  const actor =
    await obtenerActor(
      actorToken
    );

  const id = validarId(
    archivoId,
    'archivo'
  );

  const accionNormalizada =
    String(accion || '')
      .trim()
      .toUpperCase();

  if (
    accionNormalizada !== 'VISUALIZACION' &&
    accionNormalizada !== 'DESCARGA'
  ) {
    throw crearError(
      'La acción sobre el archivo es inválida.',
      400
    );
  }

  const archivo =
    await solicitudModel
      .getArchivoById(id);

  if (!archivo) {
    throw crearError(
      'Archivo no encontrado.',
      404
    );
  }

  if (
    archivo.solicitud_tipo !==
    TIPO_JUSTIFICACION_INASISTENCIA
  ) {
    throw crearError(
      'El archivo no corresponde a una justificación de inasistencia.',
      409
    );
  }

  const solicitanteRole =
    normalizarRol(
      archivo.solicitante_role
    );

  const esPropietario =
    Number(actor.id) ===
    Number(archivo.solicitante_id);

  const esAdministrador =
    actor.role === ROL_ADMIN;

  const rrhhPuedeConsultar =
    actor.role === ROL_RRHH &&
    [
      ROL_EMPLEADO,
      ROL_SUPERVISOR
    ].includes(solicitanteRole);

  const supervisorPuedeConsultar =
    actor.role === ROL_SUPERVISOR &&
    solicitanteRole === ROL_EMPLEADO;

  const autorizado =
    esPropietario ||
    esAdministrador ||
    rrhhPuedeConsultar ||
    supervisorPuedeConsultar;

  if (!autorizado) {
    throw crearError(
      'No tiene autorización para consultar este archivo.',
      403
    );
  }

  const contenido =
    await archivoStorageService
      .readFile(
        archivo.storage_provider,
        archivo.storage_key
      );

  await solicitudModel
    .createArchivoAcceso({
      archivo_id: id,
      usuario_id: actor.id,
      accion:
        accionNormalizada,
      ip_actor:
        ipActor || null
    });

  return {
    contenido,
    nombre_original:
      archivo.nombre_original,
    mime_type:
      archivo.mime_type,
    tamanio_bytes:
      archivo.tamanio_bytes
  };
};