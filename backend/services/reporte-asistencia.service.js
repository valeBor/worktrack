const reporteModel = require('../models/reporte-asistencia.model');
const {obtenerFechaHoraActual, obtenerDiaSemanaDeFecha, obtenerRangoMes,  obtenerFechasEntre,
  horaASegundos
} = require('../utils/fecha.util');

// ======================================================
// CONSTANTES
// ======================================================

const ROLES_AUTORIZADOS = [
  'rrhh',
  'admin'
];

const ROLES_REPORTABLES = [
  'empleado',
  'supervisor'
];

const ESTADOS_VALIDOS = [
  'PRESENTE',
  'TARDE',
  'AUSENTE',
  'FALTA_JUSTIFICADA',
  'PENDIENTE',
  'SIN_HORARIO'
];

const ESTADOS_ASISTENCIA = [
  'PRESENTE',
  'TARDE'
];

const MAXIMO_DIAS_PERIODO = 366;

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

function normalizarFecha(fecha) {
  return String(fecha || '')
    .substring(0, 10);
}

// ======================================================
// VALIDAR FECHA
// ======================================================

function validarFecha(
  fecha,
  nombre = 'La fecha'
) {
  const valor = String(fecha || '')
    .trim();

  if (!obtenerDiaSemanaDeFecha(valor)) {
    throw crearError(
      `${nombre} es inválida.`,
      400
    );
  }

  return valor;
}

// ======================================================
// VALIDAR RANGO
// ======================================================

function calcularCantidadDias(
  fechaDesde,
  fechaHasta
) {
  const desde = new Date(
    `${fechaDesde}T12:00:00Z`
  );

  const hasta = new Date(
    `${fechaHasta}T12:00:00Z`
  );

  return Math.floor(
    (
      hasta.getTime() -
      desde.getTime()
    ) / 86400000
  ) + 1;
}

function validarRango(filtros) {
  const {
    fecha: fechaActual
  } = obtenerFechaHoraActual();

  const tieneFechaDesde =
    Boolean(filtros?.fechaDesde);

  const tieneFechaHasta =
    Boolean(filtros?.fechaHasta);

  if (
    tieneFechaDesde !==
    tieneFechaHasta
  ) {
    throw crearError(
      'Debe indicar fechaDesde y fechaHasta.',
      400
    );
  }

  let fechaDesde;
  let fechaHasta;

  if (
    tieneFechaDesde &&
    tieneFechaHasta
  ) {
    fechaDesde = validarFecha(
      filtros.fechaDesde,
      'La fecha desde'
    );

    fechaHasta = validarFecha(
      filtros.fechaHasta,
      'La fecha hasta'
    );
  } else {
    const rangoMes =
      obtenerRangoMes(
        fechaActual,
        0
      );

    fechaDesde =
      rangoMes.fechaDesde;

    fechaHasta =
      fechaActual;
  }

  if (fechaDesde > fechaHasta) {
    throw crearError(
      'La fecha desde no puede ser posterior a la fecha hasta.',
      400
    );
  }

  if (fechaHasta > fechaActual) {
    throw crearError(
      'La fecha hasta no puede ser futura.',
      400
    );
  }

  const cantidadDias =
    calcularCantidadDias(
      fechaDesde,
      fechaHasta
    );

  if (
    cantidadDias >
    MAXIMO_DIAS_PERIODO
  ) {
    throw crearError(
      `El período no puede superar ${MAXIMO_DIAS_PERIODO} días.`,
      400
    );
  }

  return {
    fechaDesde,
    fechaHasta
  };
}

// ======================================================
// VALIDAR FILTROS
// ======================================================

function validarUsuarioId(usuarioId) {
  if (
    usuarioId === undefined ||
    usuarioId === null ||
    usuarioId === ''
  ) {
    return null;
  }

  const valor = Number(usuarioId);

  if (
    !Number.isInteger(valor) ||
    valor <= 0
  ) {
    throw crearError(
      'El ID de usuario es inválido.',
      400
    );
  }

  return valor;
}

function validarRol(role) {
  if (!role) {
    return null;
  }

  const valor = normalizarRol(role);

  if (
    !ROLES_REPORTABLES.includes(valor)
  ) {
    throw crearError(
      'El rol debe ser empleado o supervisor.',
      400
    );
  }

  return valor;
}

function validarEstado(estado) {
  if (!estado) {
    return null;
  }

  const valor = String(estado)
    .trim()
    .toUpperCase();

  if (
    !ESTADOS_VALIDOS.includes(valor)
  ) {
    throw crearError(
      'El estado del historial es inválido.',
      400
    );
  }

  return valor;
}

function validarFiltros(filtros) {
  return {
    usuarioId:
      validarUsuarioId(
        filtros?.usuarioId
      ),

    role:
      validarRol(
        filtros?.role
      ),

    estado:
      validarEstado(
        filtros?.estado
      )
  };
}

// ======================================================
// VALIDAR ACTOR AUTENTICADO
// ======================================================

async function obtenerActor(actorToken) {
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
    await reporteModel.getActorById(
      actorId
    );

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

  actor.role =
    normalizarRol(actor.role);

  if (
    !ROLES_AUTORIZADOS.includes(
      actor.role
    )
  ) {
    throw crearError(
      'No tiene autorización para consultar reportes globales.',
      403
    );
  }

  return actor;
}

// ======================================================
// CREAR CLAVE DE USUARIO Y FECHA
// ======================================================

function crearClave(
  usuarioId,
  fecha
) {
  return `${Number(usuarioId)}|${fecha}`;
}

// ======================================================
// CREAR MAPA POR USUARIO Y FECHA
// ======================================================

function crearMapaPorFecha(
  registros,
  campoFecha
) {
  const mapa = new Map();

  for (const registro of registros) {
    const fecha = normalizarFecha(
      registro[campoFecha]
    );

    const clave = crearClave(
      registro.usuario_id,
      fecha
    );

    if (!mapa.has(clave)) {
      mapa.set(clave, registro);
    }
  }

  return mapa;
}

// ======================================================
// AGRUPAR HORARIOS POR USUARIO
// ======================================================

function agruparHorarios(horarios) {
  const mapa = new Map();

  for (const horario of horarios) {
    const usuarioId = Number(
      horario.usuario_id
    );

    const horariosUsuario =
      mapa.get(usuarioId) || [];

    horariosUsuario.push(horario);

    mapa.set(
      usuarioId,
      horariosUsuario
    );
  }

  return mapa;
}

// ======================================================
// BUSCAR HORARIO PARA UNA FECHA
// ======================================================

function buscarHorario(
  horarios,
  fecha,
  diaSemana
) {
  return horarios.find(horario => {
    const vigenteDesde =
      normalizarFecha(
        horario.vigente_desde
      );

    const vigenteHasta =
      horario.vigente_hasta
        ? normalizarFecha(
          horario.vigente_hasta
        )
        : null;

    const mismoDia =
      String(
        horario.dia_semana || ''
      )
        .trim()
        .toLowerCase() ===
      diaSemana;

    const inicioVigencia =
      vigenteDesde <= fecha;

    const finVigencia =
      !vigenteHasta ||
      vigenteHasta >= fecha;

    return (
      mismoDia &&
      inicioVigencia &&
      finVigencia
    );
  }) || null;
}

// ======================================================
// CREAR HORARIO ESPERADO
// ======================================================

function crearHorarioEsperado(
  horario,
  cambioAprobado
) {
  if (cambioAprobado) {
    return {
      hora_entrada:
        cambioAprobado
          .hora_entrada_solicitada,

      hora_salida:
        cambioAprobado
          .hora_salida_solicitada,

      modalidad:
        cambioAprobado
          .modalidad_solicitada,

      tolerancia_minutos:
        Number(
          cambioAprobado
            .tolerancia_actual || 0
        )
    };
  }

  if (!horario) {
    return null;
  }

  return {
    hora_entrada:
      horario.hora_entrada,

    hora_salida:
      horario.hora_salida,

    modalidad:
      horario.modalidad,

    tolerancia_minutos:
      Number(
        horario.tolerancia_minutos || 0
      )
  };
}

// ======================================================
// ESTADO REGISTRADO
// ======================================================

function obtenerEstadoRegistrado(
  asistencia
) {
  const estado = String(
    asistencia?.estado || ''
  )
    .trim()
    .toUpperCase();

  return ESTADOS_ASISTENCIA.includes(
    estado
  )
    ? estado
    : 'PRESENTE';
}

// ======================================================
// DETERMINAR ESTADO
// ======================================================
function determinarEstado({
  asistencia,
  horarioEsperado,
  justificacionAprobada,
  fecha,
  fechaActual,
  horaActual
}) {
  if (asistencia?.hora_entrada) {
    return obtenerEstadoRegistrado(
      asistencia
    );
  }

  if (!horarioEsperado) {
    return 'SIN_HORARIO';
  }

  if (justificacionAprobada) {
    return 'FALTA_JUSTIFICADA';
  }

  const jornadaFinalizada =
    fecha < fechaActual ||
    (
      fecha === fechaActual &&
      horaASegundos(horaActual) >
      horaASegundos(
        horarioEsperado.hora_salida
      )
    );

  return jornadaFinalizada
    ? 'AUSENTE'
    : 'PENDIENTE';
}


// ======================================================
// DETERMINAR ESTADO DE JORNADA
// ======================================================

function determinarEstadoJornada({
  asistencia,
  horarioEsperado,
  fecha,
  fechaActual,
  horaActual
}) {
  if (!asistencia?.hora_entrada) {
    return 'SIN_REGISTRO';
  }

  if (asistencia.hora_salida) {
    return 'COMPLETA';
  }

  if (fecha < fechaActual) {
    return 'INCOMPLETA';
  }

  if (!horarioEsperado) {
    return 'EN_CURSO';
  }

  const horarioFinalizado =
    horaASegundos(horaActual) >
    horaASegundos(
      horarioEsperado.hora_salida
    );

  return horarioFinalizado
    ? 'INCOMPLETA'
    : 'EN_CURSO';
}

// ======================================================
// CALCULAR HORAS TRABAJADAS
// ======================================================

function calcularHorasTrabajadas(
  asistencia
) {
  if (
    !asistencia?.hora_entrada ||
    !asistencia?.hora_salida
  ) {
    return 0;
  }

  const entrada =
    horaASegundos(
      asistencia.hora_entrada
    );

  const salida =
    horaASegundos(
      asistencia.hora_salida
    );

  if (salida <= entrada) {
    return 0;
  }

  return Number(
    (
      (salida - entrada) /
      3600
    ).toFixed(2)
  );
}

// ======================================================
// CREAR REGISTRO
// ======================================================

function crearRegistro({
  usuario,
  asistencia,
  horario,
  cambioAprobado,
  justificacionAprobada,
  fecha,
  diaSemana,
  fechaActual,
  horaActual
}) {
  const horarioEsperado =
    crearHorarioEsperado(
      horario,
      cambioAprobado
    );

  return {
    fecha,
    dia_semana: diaSemana,

    usuario: {
      id: Number(usuario.id),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      estado: Boolean(usuario.estado),
      role: normalizarRol(
        usuario.role
      )
    },

    estado: determinarEstado({
      asistencia,
      horarioEsperado,
      justificacionAprobada,
      fecha,
      fechaActual,
      horaActual
    }),

    estado_jornada:
      determinarEstadoJornada({
        asistencia,
        horarioEsperado,
        fecha,
        fechaActual,
        horaActual
      }),

    programado:
      Boolean(horarioEsperado),

    hora_entrada:
      asistencia?.hora_entrada || null,

    hora_salida:
      asistencia?.hora_salida || null,

    horas_trabajadas:
      calcularHorasTrabajadas(
        asistencia
      ),

    modalidad:
      asistencia?.tipo_asistencia ||
      horarioEsperado?.modalidad ||
      null,

    ubicacion:
      asistencia?.ubicacion || null,

    cambio_horario:
      Boolean(cambioAprobado),

    solicitud_cambio_id:
      cambioAprobado?.id || null,

    falta_justificada:
      Boolean(justificacionAprobada),

    justificacion_id:
      justificacionAprobada?.id || null,

    tipo_justificativo:
      justificacionAprobada
        ?.tipo_justificativo || null,

    tipo_justificativo_nombre:
      justificacionAprobada
        ?.tipo_justificativo_nombre ||
      null,

    motivo_justificacion:
      justificacionAprobada?.motivo ||
      null,

    horario_esperado:
      horarioEsperado
  };
}

// ======================================================
// CREAR REGISTROS DEL PERÍODO
// ======================================================

function crearRegistros({
  usuarios,
  fechas,
  asistencias,
  horarios,
  cambios,
  justificaciones,
  incluirSinHorario
}) {
  const {
    fecha: fechaActual,
    hora: horaActual
  } = obtenerFechaHoraActual();

  const asistenciasMapa =
    crearMapaPorFecha(
      asistencias,
      'fecha'
    );

  const cambiosMapa =
    crearMapaPorFecha(
      cambios,
      'fecha_solicitada'
    );

  const justificacionesMapa =
    crearMapaPorFecha(
      justificaciones,
      'fecha_inasistencia'
    );

  const horariosMapa =
    agruparHorarios(horarios);

  const registros = [];

  for (const fecha of fechas) {
    const diaSemana =
      obtenerDiaSemanaDeFecha(fecha);

    for (const usuario of usuarios) {
      const usuarioId =
        Number(usuario.id);

      const clave =
        crearClave(
          usuarioId,
          fecha
        );

      const asistencia =
        asistenciasMapa.get(clave) ||
        null;

      const cambioAprobado =
        cambiosMapa.get(clave) ||
        null;

      const justificacionAprobada =
        justificacionesMapa.get(clave) ||
        null;

      const horariosUsuario =
        horariosMapa.get(usuarioId) ||
        [];

      const horario =
        buscarHorario(
          horariosUsuario,
          fecha,
          diaSemana
        );

      const tieneHorario =
        Boolean(
          horario ||
          cambioAprobado
        );

      if (
        !incluirSinHorario &&
        !asistencia &&
        !tieneHorario
      ) {
        continue;
      }

      registros.push(
        crearRegistro({
          usuario,
          asistencia,
          horario,
          cambioAprobado,
          justificacionAprobada,
          fecha,
          diaSemana,
          fechaActual,
          horaActual
        })
      );
    }
  }

  return registros.sort(
    (registroA, registroB) => {
      const resultadoFecha =
        registroB.fecha.localeCompare(
          registroA.fecha
        );

      if (resultadoFecha !== 0) {
        return resultadoFecha;
      }

      const resultadoApellido =
        registroA.usuario.apellido
          .localeCompare(
            registroB.usuario.apellido,
            'es'
          );

      if (resultadoApellido !== 0) {
        return resultadoApellido;
      }

      return registroA.usuario.nombre
        .localeCompare(
          registroB.usuario.nombre,
          'es'
        );
    }
  );
}

// ======================================================
// CREAR RESUMEN
// ======================================================

function crearResumen(registros) {
  const usuarios = new Set(
    registros.map(
      registro =>
        registro.usuario.id
    )
  );

  const programados =
    registros.filter(
      registro =>
        registro.programado
    );

  const presentes =
    registros.filter(
      registro =>
        Boolean(
          registro.hora_entrada
        )
    );

  const evaluados =
    programados.filter(
      registro =>
        ![
          'PENDIENTE',
          'FALTA_JUSTIFICADA'
        ].includes(registro.estado)
    );

  const presentesEvaluados =
    evaluados.filter(
      registro =>
        Boolean(
          registro.hora_entrada
        )
    );

  const horasTotales =
    registros.reduce(
      (total, registro) =>
        total +
        Number(
          registro.horas_trabajadas ||
          0
        ),
      0
    );

  const porcentajeAsistencia =
    evaluados.length > 0
      ? (
        presentesEvaluados.length /
        evaluados.length
      ) * 100
      : 0;

  return {
    total_usuarios:
      usuarios.size,

    registros_programados:
      programados.length,

    registros_presentes:
      presentes.length,

    ausencias:
      registros.filter(
        registro =>
          registro.estado ===
          'AUSENTE'
      ).length,

    faltas_justificadas:
      registros.filter(
        registro =>
          registro.estado ===
          'FALTA_JUSTIFICADA'
      ).length,

    tardanzas:
      registros.filter(
        registro =>
          registro.estado ===
          'TARDE'
      ).length,

    pendientes:
      registros.filter(
        registro =>
          registro.estado ===
          'PENDIENTE'
      ).length,

    sin_horario:
      registros.filter(
        registro =>
          registro.estado ===
          'SIN_HORARIO'
      ).length,

    jornadas_incompletas:
      registros.filter(
        registro =>
          registro.estado_jornada ===
          'INCOMPLETA'
      ).length,

    horas_totales:
      Number(
        horasTotales.toFixed(2)
      ),

    promedio_horas_dia:
      presentes.length > 0
        ? Number(
          (
            horasTotales /
            presentes.length
          ).toFixed(2)
        )
        : 0,

    porcentaje_asistencia:
      Number(
        porcentajeAsistencia.toFixed(2)
      )
  };
}

// ======================================================
// APLICAR FILTROS DEL HISTORIAL
// ======================================================

function aplicarFiltros(
  registros,
  filtros
) {
  return registros.filter(
    registro => {
      if (
        filtros.usuarioId &&
        registro.usuario.id !==
        filtros.usuarioId
      ) {
        return false;
      }

      if (
        filtros.role &&
        registro.usuario.role !==
        filtros.role
      ) {
        return false;
      }

      if (
        filtros.estado &&
        registro.estado !==
        filtros.estado
      ) {
        return false;
      }

      return true;
    }
  );
}

// ======================================================
// VALIDAR USUARIO REPORTABLE
// ======================================================

function validarUsuarioReportable(
  usuarios,
  usuarioId
) {
  if (!usuarioId) {
    return;
  }

  const existe =
    usuarios.some(
      usuario =>
        Number(usuario.id) ===
        usuarioId
    );

  if (!existe) {
    throw crearError(
      'Usuario reportable no encontrado.',
      404
    );
  }
}

// ======================================================
// USUARIOS DISPONIBLES PARA FILTROS
// ======================================================

exports.obtenerUsuariosReportables =
  async actorToken => {
    await obtenerActor(actorToken);

    return reporteModel
      .getUsuariosReportablesHistorial();
  };

// ======================================================
// OBTENER REPORTE DIARIO
// ======================================================

exports.obtenerReporteDiario = async (
  actorToken,
  fechaRecibida
) => {
  await obtenerActor(actorToken);

  const {
    fecha: fechaActual,
    hora: horaActual
  } = obtenerFechaHoraActual();

  const fecha = fechaRecibida
    ? validarFecha(
      fechaRecibida,
      'La fecha del reporte'
    )
    : fechaActual;

  if (fecha > fechaActual) {
    throw crearError(
      'La fecha del reporte no puede ser futura.',
      400
    );
  }

  const diaSemana =
    obtenerDiaSemanaDeFecha(fecha);

  const [
    usuarios,
    asistencias,
    horarios,
    cambios,
    justificaciones
  ] = await Promise.all([
    reporteModel
      .getUsuariosReportables(),

    reporteModel
      .getAsistenciasByFecha(fecha),

    reporteModel
      .getHorariosByFecha(
        fecha,
        diaSemana
      ),

    reporteModel
      .getCambiosAprobadosByFecha(
        fecha
      ),

    reporteModel
      .getJustificacionesAprobadasByFecha(
        fecha
      )
  ]);

  const registros =
    crearRegistros({
      usuarios,
      fechas: [fecha],
      asistencias,
      horarios,
      cambios,
      justificaciones,
      incluirSinHorario: true
    });

  return {
    fecha,
    dia_semana: diaSemana,
    generado_en:
      `${fechaActual} ${horaActual}`,
    resumen:
      crearResumen(registros),
    registros
  };
};

// ======================================================
// OBTENER HISTORIAL GLOBAL
// ======================================================

exports.obtenerHistorial = async (
  actorToken,
  filtrosRecibidos = {}
) => {
  await obtenerActor(actorToken);

  const {
    fechaDesde,
    fechaHasta
  } = validarRango(
    filtrosRecibidos
  );

  const filtros =
    validarFiltros(
      filtrosRecibidos
    );

  const [
    usuarios,
    asistencias,
    horarios,
    cambios,
    justificaciones
  ] = await Promise.all([
    reporteModel
      .getUsuariosReportablesHistorial(),

    reporteModel
      .getAsistenciasByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getHorariosByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getCambiosAprobadosByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getJustificacionesAprobadasByPeriodo(
        fechaDesde,
        fechaHasta
      )
  ]);

  validarUsuarioReportable(
    usuarios,
    filtros.usuarioId
  );

  const registrosCompletos =
    crearRegistros({
      usuarios,
      fechas:
        obtenerFechasEntre(
          fechaDesde,
          fechaHasta
        ),
      asistencias,
      horarios,
      cambios,
      justificaciones,
      incluirSinHorario: false
    });

  const registros =
    aplicarFiltros(
      registrosCompletos,
      filtros
    );

  return {
    periodo: {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta
    },

    filtros: {
      usuario_id:
        filtros.usuarioId,

      role:
        filtros.role,

      estado:
        filtros.estado
    },

    total_registros:
      registros.length,

    resumen:
      crearResumen(registros),

    registros
  };
};
// ======================================================
// AGRUPAR REGISTROS PARA ESTADÍSTICAS
// ======================================================

function agruparRegistros(
  registros,
  obtenerGrupo
) {
  const grupos = new Map();

  for (const registro of registros) {
    const grupo =
      obtenerGrupo(registro);

    if (!grupo?.clave) {
      continue;
    }

    const agrupacion =
      grupos.get(grupo.clave) || {
        datos: grupo.datos,
        registros: []
      };

    agrupacion.registros.push(
      registro
    );

    grupos.set(
      grupo.clave,
      agrupacion
    );
  }

  return Array.from(
    grupos.values()
  ).map(agrupacion => ({
    ...agrupacion.datos,

    resumen:
      crearResumen(
        agrupacion.registros
      )
  }));
}

// ======================================================
// ESTADÍSTICAS POR ROL
// ======================================================

function crearEstadisticasPorRol(
  registros
) {
  return agruparRegistros(
    registros,
    registro => ({
      clave:
        registro.usuario.role,

      datos: {
        role:
          registro.usuario.role
      }
    })
  ).sort((grupoA, grupoB) => {
    return (
      ROLES_REPORTABLES.indexOf(
        grupoA.role
      ) -
      ROLES_REPORTABLES.indexOf(
        grupoB.role
      )
    );
  });
}

// ======================================================
// ESTADÍSTICAS POR USUARIO
// ======================================================

function crearEstadisticasPorUsuario(
  registros
) {
  return agruparRegistros(
    registros,
    registro => ({
      clave:
        String(
          registro.usuario.id
        ),

      datos: {
        usuario:
          registro.usuario
      }
    })
  ).sort((grupoA, grupoB) => {
    const resultadoApellido =
      grupoA.usuario.apellido
        .localeCompare(
          grupoB.usuario.apellido,
          'es'
        );

    if (resultadoApellido !== 0) {
      return resultadoApellido;
    }

    return grupoA.usuario.nombre
      .localeCompare(
        grupoB.usuario.nombre,
        'es'
      );
  });
}

// ======================================================
// EVOLUCIÓN DIARIA
// ======================================================

function crearEvolucionDiaria(
  registros
) {
  return agruparRegistros(
    registros,
    registro => ({
      clave:
        registro.fecha,

      datos: {
        fecha:
          registro.fecha,

        dia_semana:
          registro.dia_semana
      }
    })
  ).sort((grupoA, grupoB) =>
    grupoA.fecha.localeCompare(
      grupoB.fecha
    )
  );
}

// ======================================================
// ESTADÍSTICAS POR MODALIDAD
// ======================================================

function crearEstadisticasPorModalidad(
  registros
) {
  const registrosConModalidad =
    registros.filter(
      registro =>
        registro.modalidad ===
        'PRESENCIAL' ||
        registro.modalidad ===
        'HOME'
    );

  return agruparRegistros(
    registrosConModalidad,
    registro => ({
      clave:
        registro.modalidad,

      datos: {
        modalidad:
          registro.modalidad
      }
    })
  ).sort((grupoA, grupoB) =>
    grupoA.modalidad.localeCompare(
      grupoB.modalidad
    )
  );
}

// ======================================================
// OBTENER ESTADÍSTICAS GLOBALES
// ======================================================

exports.obtenerEstadisticas = async (
  actorToken,
  filtrosRecibidos = {}
) => {
  await obtenerActor(actorToken);

  const {
    fechaDesde,
    fechaHasta
  } = validarRango(
    filtrosRecibidos
  );

  const filtros = {
    usuarioId:
      validarUsuarioId(
        filtrosRecibidos.usuarioId
      ),

    role:
      validarRol(
        filtrosRecibidos.role
      ),

    estado: null
  };

  const [
    usuarios,
    asistencias,
    horarios,
    cambios,
    justificaciones
  ] = await Promise.all([
    reporteModel
      .getUsuariosReportablesHistorial(),

    reporteModel
      .getAsistenciasByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getHorariosByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getCambiosAprobadosByPeriodo(
        fechaDesde,
        fechaHasta
      ),

    reporteModel
      .getJustificacionesAprobadasByPeriodo(
        fechaDesde,
        fechaHasta
      )
  ]);

  validarUsuarioReportable(
    usuarios,
    filtros.usuarioId
  );

  const registrosCompletos =
    crearRegistros({
      usuarios,

      fechas:
        obtenerFechasEntre(
          fechaDesde,
          fechaHasta
        ),

      asistencias,
      horarios,
      cambios,
      justificaciones,
      incluirSinHorario: false
    });

  const registros =
    aplicarFiltros(
      registrosCompletos,
      filtros
    );

  return {
    periodo: {
      fecha_desde:
        fechaDesde,

      fecha_hasta:
        fechaHasta
    },

    filtros: {
      usuario_id:
        filtros.usuarioId,

      role:
        filtros.role
    },

    resumen:
      crearResumen(registros),

    por_rol:
      crearEstadisticasPorRol(
        registros
      ),

    por_usuario:
      crearEstadisticasPorUsuario(
        registros
      ),

    evolucion_diaria:
      crearEvolucionDiaria(
        registros
      ),

    por_modalidad:
      crearEstadisticasPorModalidad(
        registros
      )
  };
};
