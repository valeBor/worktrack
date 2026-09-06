const historialModel = require(
  '../models/historial-asistencia.model'
);
const asistenciaModel = require(
  '../models/asistencia.model'
);
const horarioModel = require(
  '../models/horario.model'
);
const solicitudModel = require(
  '../models/solicitud.model'
);

const {
  obtenerFechaHoraActual,
  obtenerDiaSemanaDeFecha,
  obtenerRangoMes,
  obtenerFechasEntre,
  horaASegundos
} = require('../utils/fecha.util');

// ======================================================
// CONSTANTES
// ======================================================

const PERIODOS_VALIDOS = [
  'mes_actual',
  'mes_anterior',
  'todos'
];

// ======================================================
// ERRORES
// ======================================================

function crearError(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

// ======================================================
// VALIDACIONES GENERALES
// ======================================================

function validarId(id, nombre = 'usuario') {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw crearError(`El ID de ${nombre} es inválido.`, 400);
  }

  return idNumerico;
}

function validarPeriodo(periodo) {
  const valor = String(periodo || 'mes_actual')
    .trim()
    .toLowerCase();

  if (!PERIODOS_VALIDOS.includes(valor)) {
    throw crearError(
      'El período debe ser mes_actual, mes_anterior o todos.',
      400
    );
  }

  return valor;
}

function normalizarFecha(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === 'string') {
    return valor.substring(0, 10);
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const zonaHoraria =
      process.env.APP_TIMEZONE ||
      'America/Argentina/Buenos_Aires';

    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(valor);

    const valores = {};

    for (const parte of partes) {
      if (parte.type !== 'literal') {
        valores[parte.type] = parte.value;
      }
    }

    return `${valores.year}-${valores.month}-${valores.day}`;
  }

  const fecha = String(valor).substring(0, 10);

  return obtenerDiaSemanaDeFecha(fecha)
    ? fecha
    : null;
}

// ======================================================
// USUARIO AUTENTICADO
// ======================================================

async function obtenerUsuarioAutenticado(usuarioId) {
  const id = Number(usuarioId);

  if (!Number.isInteger(id) || id <= 0) {
    throw crearError('Usuario no autenticado.', 401);
  }

  const usuario = await historialModel.getUsuarioById(id);

  if (
    !usuario ||
    !Boolean(usuario.estado) ||
    Boolean(usuario.cuenta_bloqueada)
  ) {
    throw crearError(
      'El usuario no existe, está inactivo o tiene la cuenta bloqueada.',
      401
    );
  }

  return {
    ...usuario,
    role: String(usuario.role || '')
      .trim()
      .toLowerCase()
  };
}

// ======================================================
// PRIMERA FECHA DISPONIBLE
// ======================================================

function obtenerPrimeraFecha(
  primeraAsistencia,
  primeraVigencia,
  primeraSolicitudAprobada,
  fechaPredeterminada
) {
  const fechas = [
    normalizarFecha(primeraAsistencia),
    normalizarFecha(primeraVigencia),
    normalizarFecha(primeraSolicitudAprobada)
  ].filter(Boolean);

  if (fechas.length === 0) {
    return fechaPredeterminada;
  }

  return fechas.sort()[0];
}

// ======================================================
// DETERMINAR RANGO
// ======================================================

function determinarRango(periodo, fechaActual, primeraFecha) {
  if (periodo === 'mes_actual') {
    const rango = obtenerRangoMes(fechaActual, 0);

    return {
      fechaDesde: rango.fechaDesde,
      fechaHasta: fechaActual
    };
  }

  if (periodo === 'mes_anterior') {
    return obtenerRangoMes(fechaActual, -1);
  }

  return {
    fechaDesde:
      primeraFecha <= fechaActual
        ? primeraFecha
        : fechaActual,
    fechaHasta: fechaActual
  };
}

// ======================================================
// CREAR MAPA POR FECHA
// ======================================================

function crearMapaPorFecha(registros, campoFecha) {
  const mapa = new Map();

  for (const registro of registros) {
    const fecha = normalizarFecha(
      registro[campoFecha]
    );

    if (fecha && !mapa.has(fecha)) {
      mapa.set(fecha, registro);
    }
  }

  return mapa;
}

// ======================================================
// BUSCAR HORARIO PARA UNA FECHA
// ======================================================

function buscarHorarioParaFecha(
  horarios,
  fecha,
  diaSemana
) {
  return horarios.find(horario => {
    const vigenteDesde = normalizarFecha(
      horario.vigente_desde
    );

    const vigenteHasta = normalizarFecha(
      horario.vigente_hasta
    );

    const mismoDia =
      String(horario.dia_semana || '')
        .trim()
        .toLowerCase() === diaSemana;

    const comenzo =
      Boolean(vigenteDesde) &&
      vigenteDesde <= fecha;

    const noFinalizo =
      !vigenteHasta ||
      vigenteHasta >= fecha;

    return mismoDia && comenzo && noFinalizo;
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
        cambioAprobado.hora_entrada_solicitada,
      hora_salida:
        cambioAprobado.hora_salida_solicitada,
      modalidad:
        cambioAprobado.modalidad_actual,
      tolerancia_minutos:
        Number(cambioAprobado.tolerancia_actual)
    };
  }

  if (!horario) {
    return null;
  }

  return {
    hora_entrada: horario.hora_entrada,
    hora_salida: horario.hora_salida,
    modalidad: horario.modalidad,
    tolerancia_minutos:
      Number(horario.tolerancia_minutos)
  };
}

// ======================================================
// CALCULAR HORAS TRABAJADAS
// ======================================================

function calcularHorasTrabajadas(asistencia) {
  if (
    !asistencia?.hora_entrada ||
    !asistencia?.hora_salida
  ) {
    return 0;
  }

  const entrada = horaASegundos(
    asistencia.hora_entrada
  );

  const salida = horaASegundos(
    asistencia.hora_salida
  );

  if (salida <= entrada) {
    return 0;
  }

  return Number(
    ((salida - entrada) / 3600).toFixed(2)
  );
}

// ======================================================
// DETERMINAR ESTADO DIARIO
// ======================================================

function determinarEstadoDiario({
  asistencia,
  horarioEsperado,
  fecha,
  fechaActual,
  horaActual
}) {
  if (asistencia?.hora_entrada) {
    return String(
      asistencia.estado || 'PRESENTE'
    ).toUpperCase();
  }

  if (!horarioEsperado) {
    return null;
  }

  if (
    fecha === fechaActual &&
    horaASegundos(horaActual) <=
      horaASegundos(horarioEsperado.hora_salida)
  ) {
    return 'PENDIENTE';
  }

  return 'AUSENTE';
}

// ======================================================
// DETERMINAR ESTADO DE LA JORNADA
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

  if (
    fecha === fechaActual &&
    horarioEsperado &&
    horaASegundos(horaActual) <=
      horaASegundos(horarioEsperado.hora_salida)
  ) {
    return 'EN_CURSO';
  }

  return 'INCOMPLETA';
}

// ======================================================
// CREAR REGISTROS DIARIOS
// ======================================================

function crearRegistrosDiarios({
  fechas,
  horarios,
  asistencias,
  cambios,
  fechaActual,
  horaActual
}) {
  const asistenciasPorFecha = crearMapaPorFecha(
    asistencias,
    'fecha'
  );

  const cambiosPorFecha = crearMapaPorFecha(
    cambios,
    'fecha_solicitada'
  );

  const registros = [];

  for (const fecha of fechas) {
    const diaSemana =
      obtenerDiaSemanaDeFecha(fecha);

    const asistencia =
      asistenciasPorFecha.get(fecha) || null;

    const cambioAprobado =
      cambiosPorFecha.get(fecha) || null;

    const horario = buscarHorarioParaFecha(
      horarios,
      fecha,
      diaSemana
    );

    const horarioEsperado = crearHorarioEsperado(
      horario,
      cambioAprobado
    );

    if (!asistencia && !horarioEsperado) {
      continue;
    }

    const estado = determinarEstadoDiario({
      asistencia,
      horarioEsperado,
      fecha,
      fechaActual,
      horaActual
    });

    const estadoJornada = determinarEstadoJornada({
      asistencia,
      horarioEsperado,
      fecha,
      fechaActual,
      horaActual
    });

    registros.push({
      fecha,
      dia_semana: diaSemana,
      estado,
      estado_jornada: estadoJornada,
      programado: Boolean(horarioEsperado),
      hora_entrada:
        asistencia?.hora_entrada || null,
      hora_salida:
        asistencia?.hora_salida || null,
      horas_trabajadas:
        calcularHorasTrabajadas(asistencia),
      modalidad:
        asistencia?.tipo_asistencia ||
        horarioEsperado?.modalidad ||
        null,
      cambio_horario:
        Boolean(cambioAprobado),
      solicitud_cambio_id:
        cambioAprobado?.id || null,
      horario_esperado: horarioEsperado
    });
  }

  return registros.sort(
    (a, b) => b.fecha.localeCompare(a.fecha)
  );
}

// ======================================================
// CREAR RESUMEN
// ======================================================

function crearResumen(registros) {
  const diasPresentes = registros.filter(
    registro => Boolean(registro.hora_entrada)
  ).length;

  const llegadasTarde = registros.filter(
    registro => registro.estado === 'TARDE'
  ).length;

  const ausencias = registros.filter(
    registro => registro.estado === 'AUSENTE'
  ).length;

  const registrosIncompletos = registros.filter(
    registro =>
      registro.estado_jornada === 'INCOMPLETA'
  ).length;

  const horasTotales = registros.reduce(
    (total, registro) =>
      total + registro.horas_trabajadas,
    0
  );

  const diasProgramadosEvaluados =
    registros.filter(
      registro =>
        registro.programado &&
        registro.estado !== 'PENDIENTE'
    ).length;

  const presentesProgramados =
    registros.filter(
      registro =>
        registro.programado &&
        Boolean(registro.hora_entrada)
    ).length;

  const porcentajeAsistencia =
    diasProgramadosEvaluados > 0
      ? (
          presentesProgramados /
          diasProgramadosEvaluados
        ) * 100
      : 0;

  const promedioHorasDia =
    diasPresentes > 0
      ? horasTotales / diasPresentes
      : 0;

  return {
    dias_programados:
      diasProgramadosEvaluados,
    dias_presentes: diasPresentes,
    horas_totales:
      Number(horasTotales.toFixed(2)),
    llegadas_tarde: llegadasTarde,
    ausencias,
    registros_incompletos:
      registrosIncompletos,
    promedio_horas_dia:
      Number(promedioHorasDia.toFixed(2)),
    porcentaje_asistencia:
      Number(porcentajeAsistencia.toFixed(2))
  };
}

// ======================================================
// GENERAR HISTORIAL
// ======================================================

async function generarHistorial(
  usuario,
  periodoRecibido
) {
  const periodo = validarPeriodo(periodoRecibido);

  const {
    fecha: fechaActual,
    hora: horaActual
  } = obtenerFechaHoraActual();

  const rangoActual = obtenerRangoMes(
    fechaActual,
    0
  );

  const [
    primeraAsistenciaResultado,
    primeraVigenciaResultado,
    primeraSolicitudResultado
  ] = await Promise.all([
    asistenciaModel.getPrimeraFechaByUsuario(
      usuario.id
    ),
    horarioModel.getPrimeraVigenciaByUsuario(
      usuario.id
    ),
    solicitudModel.getPrimeraAprobadaByUsuario(
      usuario.id
    )
  ]);

  const primeraAsistencia = normalizarFecha(
    primeraAsistenciaResultado
  );

  const primeraVigencia = normalizarFecha(
    primeraVigenciaResultado
  );

  const primeraSolicitudAprobada = normalizarFecha(
    primeraSolicitudResultado
  );

  const primeraFecha = obtenerPrimeraFecha(
    primeraAsistencia,
    primeraVigencia,
    primeraSolicitudAprobada,
    rangoActual.fechaDesde
  );

  const {
    fechaDesde,
    fechaHasta
  } = determinarRango(
    periodo,
    fechaActual,
    primeraFecha
  );

  const [
    asistencias,
    horarios,
    cambios
  ] = await Promise.all([
    asistenciaModel.getByUsuarioAndPeriodo(
      usuario.id,
      fechaDesde,
      fechaHasta
    ),
    horarioModel.getHistorialByUsuarioAndPeriodo(
      usuario.id,
      fechaDesde,
      fechaHasta
    ),
    solicitudModel.getAprobadasByUsuarioAndPeriodo(
      usuario.id,
      fechaDesde,
      fechaHasta
    )
  ]);

  const fechas = obtenerFechasEntre(
    fechaDesde,
    fechaHasta
  );

  const registros = crearRegistrosDiarios({
    fechas,
    horarios,
    asistencias,
    cambios,
    fechaActual,
    horaActual
  });

  return {
    usuario: {
      id: Number(usuario.id),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      estado: Boolean(usuario.estado),
      role: String(usuario.role || '')
        .trim()
        .toLowerCase()
    },
    periodo: {
      tipo: periodo,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      primera_asistencia: primeraAsistencia,
      primera_vigencia: primeraVigencia,
      primera_solicitud_aprobada:
        primeraSolicitudAprobada
    },
    resumen: crearResumen(registros),
    registros
  };
}

// ======================================================
// OBTENER MI HISTORIAL
// ======================================================

exports.obtenerMiHistorial = async (
  usuarioId,
  periodo
) => {
  const usuario = await obtenerUsuarioAutenticado(
    usuarioId
  );

  return generarHistorial(
    usuario,
    periodo
  );
};

// ======================================================
// OBTENER USUARIOS GESTIONABLES
// ======================================================

exports.obtenerUsuariosGestionables = async usuarioId => {
  const actor = await obtenerUsuarioAutenticado(
    usuarioId
  );

  return historialModel.getUsuariosGestionables(
    actor.id
  );
};

// ======================================================
// OBTENER HISTORIAL DE OTRO USUARIO
// ======================================================

exports.obtenerHistorialUsuario = async (
  actorId,
  usuarioObjetivoId,
  periodo
) => {
  const actor = await obtenerUsuarioAutenticado(
    actorId
  );

  const objetivoId = validarId(
    usuarioObjetivoId,
    'usuario'
  );

  const usuario =
    await historialModel.getUsuarioGestionable(
      actor.id,
      objetivoId
    );

  if (!usuario) {
    throw crearError(
      'No tiene autorización para consultar el historial de este usuario.',
      403
    );
  }

  return generarHistorial(
    usuario,
    periodo
  );
};