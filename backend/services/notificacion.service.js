const notificacionModel = require(
  '../models/notificacion.model'
);
const {
  obtenerFechaHoraActual
} = require('../utils/fecha.util');

// ======================================================
// CONSTANTES
// ======================================================

const MAXIMO_NOTIFICACIONES_USUARIO = 10;

const ROLES_VALIDOS = [
  'admin',
  'rrhh',
  'supervisor',
  'empleado'
];

const TIPOS_NOTIFICACION = {
  SOLICITUD_CREADA:
    'SOLICITUD_CREADA',
  SOLICITUD_APROBADA:
    'SOLICITUD_APROBADA',
  SOLICITUD_RECHAZADA:
    'SOLICITUD_RECHAZADA',
  CRONOGRAMA_ASIGNADO:
    'CRONOGRAMA_ASIGNADO',
  CRONOGRAMA_MODIFICADO:
    'CRONOGRAMA_MODIFICADO',
  CRONOGRAMA_FINALIZADO:
    'CRONOGRAMA_FINALIZADO'
};

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
// NORMALIZACIONES
// ======================================================

function normalizarRol(role) {
  return String(role || '')
    .trim()
    .toLowerCase();
}

function obtenerNombreCompleto(usuario) {
  return [
    usuario?.nombre,
    usuario?.apellido
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function obtenerFechaHoraTexto() {
  const {fecha, hora} =
    obtenerFechaHoraActual();

  return `${fecha} ${hora}`;
}

// ======================================================
// VALIDACIONES
// ======================================================

function validarId(
  valor,
  nombre = 'registro',
  statusCode = 400
) {
  const id = Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw crearError(
      `El ID de ${nombre} es inválido.`,
      statusCode
    );
  }

  return id;
}

function validarEntero(
  valor,
  nombre,
  valorPredeterminado,
  minimo,
  maximo
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return valorPredeterminado;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    throw crearError(
      `${nombre} debe ser un número entero entre ${minimo} y ${maximo}.`,
      400
    );
  }

  return numero;
}

function validarBooleano(
  valor,
  valorPredeterminado = false
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return valorPredeterminado;
  }

  if (
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    String(valor).toLowerCase() ===
      'true'
  ) {
    return true;
  }

  if (
    valor === false ||
    valor === 0 ||
    valor === '0' ||
    String(valor).toLowerCase() ===
      'false'
  ) {
    return false;
  }

  throw crearError(
    'El filtro soloNoLeidas debe ser verdadero o falso.',
    400
  );
}

// ======================================================
// USUARIO AUTENTICADO
// ======================================================

async function obtenerActor(actorToken) {
  const actorId = validarId(
    actorToken?.id,
    'usuario autenticado',
    401
  );

  const actor =
    await notificacionModel
      .getUsuarioConRol(actorId);

  if (
    !actor ||
    !Boolean(actor.estado) ||
    Boolean(actor.cuenta_bloqueada)
  ) {
    throw crearError(
      'El usuario no existe, está inactivo o tiene la cuenta bloqueada.',
      401
    );
  }

  actor.id = Number(actor.id);
  actor.role = normalizarRol(
    actor.role
  );

  if (
    !ROLES_VALIDOS.includes(
      actor.role
    )
  ) {
    throw crearError(
      'El usuario no tiene un rol válido.',
      403
    );
  }

  return actor;
}

// ======================================================
// VALIDAR DATOS INTERNOS DE NOTIFICACIÓN
// ======================================================

function validarDatosNotificacion(datos) {
  const tipo = String(
    datos?.tipo || ''
  ).trim();

  const titulo = String(
    datos?.titulo || ''
  ).trim();

  const mensaje = String(
    datos?.mensaje || ''
  ).trim();

  if (!tipo || tipo.length > 50) {
    throw crearError(
      'El tipo de notificación es inválido.',
      500
    );
  }

  if (
    !titulo ||
    titulo.length > 150
  ) {
    throw crearError(
      'El título de la notificación es inválido.',
      500
    );
  }

  if (!mensaje) {
    throw crearError(
      'El mensaje de la notificación es obligatorio.',
      500
    );
  }

  const entidadTipo =
    datos.entidad_tipo
      ? String(
          datos.entidad_tipo
        ).trim()
      : null;

  const entidadId =
    datos.entidad_id === null ||
    datos.entidad_id === undefined
      ? null
      : validarId(
          datos.entidad_id,
          'entidad',
          500
        );

  if (
    Boolean(entidadTipo) !==
    Boolean(entidadId)
  ) {
    throw crearError(
      'La entidad relacionada con la notificación es inválida.',
      500
    );
  }

  return {
    tipo,
    titulo,
    mensaje,
    entidad_tipo: entidadTipo,
    entidad_id: entidadId
  };
}

// ======================================================
// CREAR Y LIMITAR NOTIFICACIONES
// ======================================================

async function crearNotificaciones(
  connection,
  destinatarios,
  datos
) {
  const datosValidados =
    validarDatosNotificacion(datos);

  const idsDestinatarios = [
    ...new Set(
      destinatarios
        .map(usuario =>
          Number(usuario?.id)
        )
        .filter(id =>
          Number.isInteger(id) &&
          id > 0
        )
    )
  ];

  if (idsDestinatarios.length === 0) {
    return {
      creadas: 0,
      eliminadas: 0
    };
  }

  const notificaciones =
    idsDestinatarios.map(
      usuarioId => ({
        usuario_id: usuarioId,
        actor_id:
          datos.actor_id || null,
        tipo: datosValidados.tipo,
        titulo:
          datosValidados.titulo,
        mensaje:
          datosValidados.mensaje,
        entidad_tipo:
          datosValidados
            .entidad_tipo,
        entidad_id:
          datosValidados
            .entidad_id,
        creada_en:
          datos.creada_en ||
          obtenerFechaHoraTexto()
      })
    );

  const resultadoCreacion =
    await notificacionModel
      .createMany(
        connection,
        notificaciones
      );

  let eliminadas = 0;

  for (
    const usuarioId
    of idsDestinatarios
  ) {
    const resultadoLimpieza =
      await notificacionModel
        .deleteExcessByUsuario(
          connection,
          usuarioId,
          MAXIMO_NOTIFICACIONES_USUARIO
        );

    eliminadas += Number(
      resultadoLimpieza
        .affectedRows || 0
    );
  }

  return {
    creadas: Number(
      resultadoCreacion
        .affectedRows || 0
    ),
    eliminadas
  };
}

// ======================================================
// NOTIFICAR SOLICITUD CREADA
// ======================================================

exports.notificarSolicitudCreada =
  async (
    connection,
       {
      solicitudId,
      solicitante,
      fechaSolicitada,
      creadaEn,
      tipo
    }
  ) => {
    const solicitudIdValidado =
      validarId(
        solicitudId,
        'solicitud',
        500
      );

    const solicitanteId =
      validarId(
        solicitante?.id,
        'solicitante',
        500
      );

    const rolSolicitante =
      normalizarRol(
        solicitante?.role
      );

    let rolesDestinatarios;

    if (
      rolSolicitante ===
      'empleado'
    ) {
      rolesDestinatarios = [
        'supervisor',
        'rrhh',
        'admin'
      ];
    } else if (
      rolSolicitante ===
      'supervisor'
    ) {
      rolesDestinatarios = [
        'rrhh',
        'admin'
      ];
    } else {
      throw crearError(
        'El rol del solicitante no permite generar esta notificación.',
        409
      );
    }

    const destinatarios =
      await notificacionModel
        .getUsuariosActivosPorRoles(
          connection,
          rolesDestinatarios
        );

    const nombre =
      obtenerNombreCompleto(
        solicitante
      ) ||
      `Usuario ${solicitanteId}`;

    return crearNotificaciones(
      connection,
      destinatarios,
      {
        actor_id: solicitanteId,
        tipo:
          TIPOS_NOTIFICACION
            .SOLICITUD_CREADA,
               titulo:
          tipo === 'JUSTIFICATIVO_FALTA'
            ? 'Nuevo justificativo de falta'
            : 'Nueva solicitud de cambio',
        mensaje:
          tipo === 'JUSTIFICATIVO_FALTA'
            ? `${nombre} justificó una falta para el ${fechaSolicitada}.`
            : `${nombre} solicitó un cambio de horario para el ${fechaSolicitada}.`,
        entidad_tipo:
          'SOLICITUD',
        entidad_id:
          solicitudIdValidado,
        creada_en: creadaEn
      }
    );
  };

// ======================================================
// NOTIFICAR SOLICITUD RESUELTA
// ======================================================

exports.notificarSolicitudResuelta =
  async (
    connection,
     {
      solicitudId,
      solicitante,
      responsable,
      estado,
      fechaSolicitada,
      resueltaEn,
      tipo
    }
  ) => {
    const solicitudIdValidado =
      validarId(
        solicitudId,
        'solicitud',
        500
      );

    const solicitanteId =
      validarId(
        solicitante?.id,
        'solicitante',
        500
      );

    const responsableId =
      validarId(
        responsable?.id,
        'responsable',
        500
      );

    const estadoNormalizado =
      String(estado || '')
        .trim()
        .toUpperCase();

    if (
      estadoNormalizado !==
        'APROBADA' &&
      estadoNormalizado !==
        'RECHAZADA'
    ) {
      throw crearError(
        'El estado de la solicitud es inválido.',
        500
      );
    }

    const fechaEvento =
      resueltaEn ||
      obtenerFechaHoraTexto();

    await notificacionModel
      .markEventAsRead(
        connection,
        {
          tipo:
            TIPOS_NOTIFICACION
              .SOLICITUD_CREADA,
          entidadTipo:
            'SOLICITUD',
          entidadId:
            solicitudIdValidado,
          fechaLectura:
            fechaEvento
        }
      );

    const aprobada =
      estadoNormalizado ===
      'APROBADA';

    const responsableNombre =
      obtenerNombreCompleto(
        responsable
      );

    const detalleResponsable =
      responsableNombre
        ? ` por ${responsableNombre}`
        : '';

    return crearNotificaciones(
      connection,
      [
        {
          id: solicitanteId
        }
      ],
      {
        actor_id: responsableId,
        tipo: aprobada
          ? TIPOS_NOTIFICACION
              .SOLICITUD_APROBADA
          : TIPOS_NOTIFICACION
              .SOLICITUD_RECHAZADA,
            titulo: aprobada
          ? 'Solicitud aprobada'
          : 'Solicitud rechazada',
        mensaje:
          `Tu ${
            tipo === 'JUSTIFICATIVO_FALTA'
              ? 'justificativo de falta'
              : 'solicitud de cambio'
          } para el ${fechaSolicitada} fue ${
            aprobada
              ? 'aprobada'
              : 'rechazada'
          }${detalleResponsable}.`,
        entidad_tipo:
          'SOLICITUD',
        entidad_id:
          solicitudIdValidado,
        creada_en:
          fechaEvento
      }
    );
  };

// ======================================================
// NOTIFICAR CRONOGRAMA
// ======================================================

async function notificarCronograma(
  connection,
  {
    tipo,
    usuario,
    actor,
    fechaVigencia,
    creadaEn
  }
) {
  const usuarioId = validarId(
    usuario?.id,
    'usuario',
    500
  );

  const actorId = validarId(
    actor?.id,
    'actor',
    500
  );

  if (usuarioId === actorId) {
    return {
      creadas: 0,
      eliminadas: 0
    };
  }

  const configuraciones = {
    [TIPOS_NOTIFICACION
      .CRONOGRAMA_ASIGNADO]: {
      titulo:
        'Cronograma asignado',
      accion:
        'asignado',
      detalleFecha:
        fechaVigencia
          ? ` con vigencia desde el ${fechaVigencia}`
          : ''
    },

    [TIPOS_NOTIFICACION
      .CRONOGRAMA_MODIFICADO]: {
      titulo:
        'Cronograma modificado',
      accion:
        'modificado',
      detalleFecha:
        fechaVigencia
          ? ` con vigencia desde el ${fechaVigencia}`
          : ''
    },

    [TIPOS_NOTIFICACION
      .CRONOGRAMA_FINALIZADO]: {
      titulo:
        'Cronograma finalizado',
      accion:
        'finalizado',
      detalleFecha:
        fechaVigencia
          ? ` con vigencia hasta el ${fechaVigencia}`
          : ''
    }
  };

  const configuracion =
    configuraciones[tipo];

  if (!configuracion) {
    throw crearError(
      'El tipo de notificación de cronograma es inválido.',
      500
    );
  }

  return crearNotificaciones(
    connection,
    [
      {
        id: usuarioId
      }
    ],
    {
      actor_id: actorId,
      tipo,
      titulo:
        configuracion.titulo,
      mensaje:
        `Tu cronograma laboral fue ${configuracion.accion}${configuracion.detalleFecha}.`,
      entidad_tipo:
        'CRONOGRAMA',
      entidad_id:
        usuarioId,
      creada_en: creadaEn
    }
  );
}

exports.notificarCronogramaAsignado =
  async (
    connection,
    datos
  ) => {
    return notificarCronograma(
      connection,
      {
        ...datos,
        tipo:
          TIPOS_NOTIFICACION
            .CRONOGRAMA_ASIGNADO
      }
    );
  };

exports.notificarCronogramaModificado =
  async (
    connection,
    datos
  ) => {
    return notificarCronograma(
      connection,
      {
        ...datos,
        tipo:
          TIPOS_NOTIFICACION
            .CRONOGRAMA_MODIFICADO
      }
    );
  };

exports.notificarCronogramaFinalizado =
  async (
    connection,
    datos
  ) => {
    return notificarCronograma(
      connection,
      {
        ...datos,
        tipo:
          TIPOS_NOTIFICACION
            .CRONOGRAMA_FINALIZADO
      }
    );
  };

// ======================================================
// OBTENER NOTIFICACIONES PROPIAS
// ======================================================

exports.obtenerNotificaciones =
  async (
    actorToken,
    filtros = {}
  ) => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const pagina =
      validarEntero(
        filtros.pagina,
        'La página',
        1,
        1,
        100000
      );

    const limite =
      validarEntero(
        filtros.limite,
        'El límite',
        10,
        1,
        MAXIMO_NOTIFICACIONES_USUARIO
      );

    const soloNoLeidas =
      validarBooleano(
        filtros.soloNoLeidas,
        false
      );

    const offset =
      (pagina - 1) * limite;

    const [
      notificaciones,
      total,
      totalNoLeidas
    ] = await Promise.all([
      notificacionModel
        .getByUsuario(
          actor.id,
          {
            soloNoLeidas,
            limite,
            offset
          }
        ),

      notificacionModel
        .countByUsuario(
          actor.id,
          soloNoLeidas
        ),

      notificacionModel
        .countNoLeidasByUsuario(
          actor.id
        )
    ]);

    return {
      pagina,
      limite,
      total,
      total_paginas:
        total > 0
          ? Math.ceil(
              total / limite
            )
          : 0,
      total_no_leidas:
        totalNoLeidas,
      solo_no_leidas:
        soloNoLeidas,
      notificaciones
    };
  };

// ======================================================
// CONTADOR DE NOTIFICACIONES NO LEÍDAS
// ======================================================

exports.obtenerContador =
  async actorToken => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const totalNoLeidas =
      await notificacionModel
        .countNoLeidasByUsuario(
          actor.id
        );

    return {
      total_no_leidas:
        totalNoLeidas
    };
  };

// ======================================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ======================================================

exports.marcarComoLeida =
  async (
    actorToken,
    notificacionId
  ) => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const id = validarId(
      notificacionId,
      'notificación'
    );

    const notificacion =
      await notificacionModel
        .getByIdAndUsuario(
          id,
          actor.id
        );

    if (!notificacion) {
      throw crearError(
        'Notificación no encontrada.',
        404
      );
    }

    if (notificacion.leido) {
      return {
        mensaje:
          'La notificación ya estaba marcada como leída.',
        notificacion
      };
    }

    await notificacionModel
      .markAsRead(
        id,
        actor.id,
        obtenerFechaHoraTexto()
      );

    const actualizada =
      await notificacionModel
        .getByIdAndUsuario(
          id,
          actor.id
        );

    return {
      mensaje:
        'Notificación marcada como leída.',
      notificacion:
        actualizada
    };
  };

// ======================================================
// MARCAR TODAS COMO LEÍDAS
// ======================================================

exports.marcarTodasComoLeidas =
  async actorToken => {
    const actor =
      await obtenerActor(
        actorToken
      );

    const resultado =
      await notificacionModel
        .markAllAsRead(
          actor.id,
          obtenerFechaHoraTexto()
        );

    const cantidadActualizada =
      Number(
        resultado.affectedRows || 0
      );

    return {
      mensaje:
        cantidadActualizada > 0
          ? 'Todas las notificaciones fueron marcadas como leídas.'
          : 'No había notificaciones pendientes de lectura.',
      cantidad_actualizada:
        cantidadActualizada
    };
  };