const db = require('../config/db');

const solicitudModel =
  require('../models/solicitud.model');

const horarioModel =
  require('../models/horario.model');

const {
  obtenerFechaHoraActual,
  obtenerDiaSemanaDeFecha,
  horaASegundos
} = require('../utils/fecha.util');


// ======================================================
// CONSTANTES
// ======================================================

const TIPO_CAMBIO_HORARIO =
  'CAMBIO_HORARIO';

const ESTADOS_RESOLUCION = [
  'APROBADA',
  'RECHAZADA'
];

const ROLES_CONSULTA_PENDIENTES = [
  'supervisor',
  'rrhh',
  'admin'
];

const ROLES_RESOLUCION = [
  'supervisor',
  'rrhh'
];


// ======================================================
// CREAR ERROR
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
// NORMALIZAR ROL
// ======================================================

function normalizarRol(role) {
  return String(
    role || ''
  )
    .trim()
    .toLowerCase();
}


// ======================================================
// VALIDAR ID
// ======================================================

function validarId(
  id,
  nombre = 'solicitud'
) {
  const idNumerico = Number(id);

  if (
    !Number.isInteger(idNumerico)
    ||
    idNumerico <= 0
  ) {
    throw crearError(
      `El ID de ${nombre} es inválido.`,
      400
    );
  }

  return idNumerico;
}


// ======================================================
// OBTENER ACTOR AUTENTICADO
// ======================================================

async function obtenerActor(
  actorToken,
  rolesPermitidos
) {
  const actorId = validarId(
    actorToken?.id,
    'usuario autenticado'
  );

  const actor =
    await horarioModel.getUsuarioConRol(
      actorId
    );

  if (
    !actor
    ||
    !Boolean(actor.estado)
  ) {
    throw crearError(
      'El usuario autenticado no existe o está inactivo.',
      401
    );
  }

  actor.role =
    normalizarRol(actor.role);

  if (
    !rolesPermitidos.includes(
      actor.role
    )
  ) {
    throw crearError(
      'No tiene permisos para realizar esta acción.',
      403
    );
  }

  return actor;
}


// ======================================================
// VALIDAR Y NORMALIZAR HORA
// ======================================================

function validarHora(
  hora,
  nombre
) {
  const valor =
    String(hora || '').trim();

  const formatoValido =
    /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
      .test(valor);

  if (!formatoValido) {
    throw crearError(
      `${nombre} es inválida.`,
      400
    );
  }

  if (valor.length === 5) {
    return `${valor}:00`;
  }

  return valor;
}


// ======================================================
// VALIDAR MOTIVO
// ======================================================

function validarMotivo(motivo) {
  const valor =
    String(motivo || '').trim();

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
// VALIDAR FECHA SOLICITADA
// ======================================================

function validarFechaSolicitada(
  fechaSolicitada
) {
  const fecha =
    String(
      fechaSolicitada || ''
    ).trim();

  const diaSemana =
    obtenerDiaSemanaDeFecha(fecha);

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
// NORMALIZAR FECHA OBTENIDA DE LA BASE
// ======================================================

function normalizarFechaBaseDatos(valor) {
  if (!valor) {
    return '';
  }

  if (typeof valor === 'string') {
    return valor.substring(0, 10);
  }

  if (valor instanceof Date) {
    const anio =
      valor.getFullYear();

    const mes =
      String(
        valor.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        valor.getDate()
      ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  return String(valor).substring(0, 10);
}


// ======================================================
// VALIDAR DATOS PARA CREAR
// ======================================================

function validarDatosCreacion(datos) {
  if (
    !datos
    ||
    typeof datos !== 'object'
    ||
    Array.isArray(datos)
  ) {
    throw crearError(
      'Los datos de la solicitud son obligatorios.',
      400
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'usuario_id'
    )
  ) {
    throw crearError(
      'El usuario de la solicitud se obtiene de la sesión.',
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
      datos.hora_entrada_solicitada,
      'La hora de entrada solicitada'
    );

  const horaSalida =
    validarHora(
      datos.hora_salida_solicitada,
      'La hora de salida solicitada'
    );

  if (
    horaASegundos(horaEntrada)
    >=
    horaASegundos(horaSalida)
  ) {
    throw crearError(
      'La hora de salida solicitada debe ser posterior a la hora de entrada.',
      400
    );
  }

  const motivo =
    validarMotivo(datos.motivo);

  return {
    fecha,
    diaSemana,
    hora_entrada_solicitada:
      horaEntrada,
    hora_salida_solicitada:
      horaSalida,
    motivo
  };
}


// ======================================================
// VALIDAR RESPUESTA
// ======================================================

function validarRespuesta(
  estado,
  respuesta
) {
  const valor =
    String(
      respuesta || ''
    ).trim();

  if (
    estado === 'RECHAZADA'
    &&
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
// CREAR SOLICITUD DE CAMBIO DE HORARIO
// ======================================================

exports.createSolicitud = async (
  actorToken,
  datos
) => {
  const empleado =
    await obtenerActor(
      actorToken,
      ['empleado']
    );

  const solicitudValidada =
    validarDatosCreacion(datos);

  const horarioActual =
    await horarioModel.getByUsuarioAndDia(
      empleado.id,
      solicitudValidada.diaSemana
    );

  if (!horarioActual) {
    throw crearError(
      'No tiene un horario asignado para la fecha seleccionada.',
      404
    );
  }

  const horaEntradaActual =
    validarHora(
      horarioActual.hora_entrada,
      'La hora de entrada actual'
    );

  const horaSalidaActual =
    validarHora(
      horarioActual.hora_salida,
      'La hora de salida actual'
    );

  const mismoHorario =
    horaASegundos(horaEntradaActual)
      ===
      horaASegundos(
        solicitudValidada
          .hora_entrada_solicitada
      )
    &&
    horaASegundos(horaSalidaActual)
      ===
      horaASegundos(
        solicitudValidada
          .hora_salida_solicitada
      );

  if (mismoHorario) {
    throw crearError(
      'El horario solicitado es igual al horario actual.',
      400
    );
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const solicitudActiva =
      await solicitudModel
        .getActivaByUsuarioAndFecha(
          connection,
          empleado.id,
          solicitudValidada.fecha
        );

    if (solicitudActiva) {
      const mensaje =
        solicitudActiva.estado
          === 'APROBADA'
          ? 'Ya existe un cambio de horario aprobado para esa fecha.'
          : 'Ya existe una solicitud pendiente para esa fecha.';

      throw crearError(
        mensaje,
        409
      );
    }

    const result =
      await solicitudModel.create(
        connection,
        {
          usuario_id:
            empleado.id,

          tipo:
            TIPO_CAMBIO_HORARIO,

          estado:
            'PENDIENTE',

          fecha_solicitada:
            solicitudValidada.fecha,

          hora_entrada_actual:
            horaEntradaActual,

          hora_salida_actual:
            horaSalidaActual,

          modalidad_actual:
            horarioActual.modalidad,

          tolerancia_actual:
            Number(
              horarioActual
                .tolerancia_minutos
            ),

          hora_entrada_solicitada:
            solicitudValidada
              .hora_entrada_solicitada,

          hora_salida_solicitada:
            solicitudValidada
              .hora_salida_solicitada,

          motivo:
            solicitudValidada.motivo
        }
      );

    await connection.commit();

    return {
      mensaje:
        'Solicitud de cambio de horario enviada correctamente.',

      solicitud: {
        id:
          result.insertId,

        usuario_id:
          empleado.id,

        tipo:
          TIPO_CAMBIO_HORARIO,

        estado:
          'PENDIENTE',

        fecha_solicitada:
          solicitudValidada.fecha,

        hora_entrada_actual:
          horaEntradaActual,

        hora_salida_actual:
          horaSalidaActual,

        hora_entrada_solicitada:
          solicitudValidada
            .hora_entrada_solicitada,

        hora_salida_solicitada:
          solicitudValidada
            .hora_salida_solicitada,

        modalidad_actual:
          horarioActual.modalidad,

        tolerancia_actual:
          Number(
            horarioActual
              .tolerancia_minutos
          ),

        motivo:
          solicitudValidada.motivo
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
// OBTENER MI HORARIO PARA UNA FECHA
// ======================================================

exports.getMiHorarioParaFecha = async (
  actorToken,
  fechaSolicitada
) => {
  const empleado =
    await obtenerActor(
      actorToken,
      ['empleado']
    );

  const {
    fecha,
    diaSemana
  } = validarFechaSolicitada(
    fechaSolicitada
  );

  const horario =
    await horarioModel.getByUsuarioAndDia(
      empleado.id,
      diaSemana
    );

  if (!horario) {
    throw crearError(
      'No tiene un horario asignado para la fecha seleccionada.',
      404
    );
  }

  return {
    fecha_solicitada:
      fecha,

    dia_semana:
      diaSemana,

    horario_actual: {
      hora_entrada:
        horario.hora_entrada,

      hora_salida:
        horario.hora_salida,

      modalidad:
        horario.modalidad,

      tolerancia_minutos:
        Number(
          horario.tolerancia_minutos
        )
    }
  };
};


// ======================================================
// OBTENER MIS SOLICITUDES
// ======================================================

exports.getMisSolicitudes = async (
  actorToken
) => {
  const empleado =
    await obtenerActor(
      actorToken,
      ['empleado']
    );

  return solicitudModel.getByUsuario(
    empleado.id
  );
};


// ======================================================
// OBTENER SOLICITUDES PENDIENTES
// ======================================================

exports.getSolicitudesPendientes = async (
  actorToken
) => {
  await obtenerActor(
    actorToken,
    ROLES_CONSULTA_PENDIENTES
  );

  return solicitudModel.getPendientes();
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
      actorToken,
      ROLES_RESOLUCION
    );

  const id =
    validarId(
      solicitudId,
      'solicitud'
    );

  const estado =
    String(
      datos?.estado || ''
    )
      .trim()
      .toUpperCase();

  if (
    !ESTADOS_RESOLUCION.includes(
      estado
    )
  ) {
    throw crearError(
      'El estado debe ser APROBADA o RECHAZADA.',
      400
    );
  }

  const respuesta =
    validarRespuesta(
      estado,
      datos?.respuesta
    );

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const solicitud =
      await solicitudModel.getByIdForUpdate(
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
      solicitud.tipo
      !==
      TIPO_CAMBIO_HORARIO
    ) {
      throw crearError(
        'La solicitud no corresponde a un cambio de horario.',
        409
      );
    }

    if (
      solicitud.estado
      !==
      'PENDIENTE'
    ) {
      throw crearError(
        'La solicitud ya fue resuelta.',
        409
      );
    }

    if (estado === 'APROBADA') {
      const {
        fecha: fechaActual
      } = obtenerFechaHoraActual();

      const fechaSolicitada =
        normalizarFechaBaseDatos(
          solicitud.fecha_solicitada
        );

      if (
        !fechaSolicitada
        ||
        fechaSolicitada <= fechaActual
      ) {
        throw crearError(
          'No se puede aprobar una solicitud cuya fecha ya llegó o pasó.',
          409
        );
      }

      const empleado =
        await horarioModel
          .getUsuarioConRol(
            solicitud.usuario_id
          );

      if (
        !empleado
        ||
        !Boolean(empleado.estado)
      ) {
        throw crearError(
          'No se puede aprobar la solicitud porque el empleado está inactivo.',
          409
        );
      }
    }

    const {
      fecha,
      hora
    } = obtenerFechaHoraActual();

    const result =
      await solicitudModel.resolve(
        connection,
        id,
        estado,
        respuesta,
        responsable.id,
        `${fecha} ${hora}`
      );

    if (result.affectedRows !== 1) {
      throw crearError(
        'La solicitud no pudo ser resuelta.',
        409
      );
    }

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
          `${fecha} ${hora}`
      }
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
};