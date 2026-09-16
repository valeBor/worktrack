const alertaModel = require('../models/alerta.model');
const {obtenerFechaHoraActual, obtenerDiaSemanaDeFecha, obtenerRangoMes, obtenerFechasEntre,
  sumarDiasAFecha, horaASegundos} = require('../utils/fecha.util');
  
const DIAS_INCIDENCIAS = 7;
const PORCENTAJE_MINIMO = 80;
const JORNADAS_MINIMAS = 5;

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function validarPaginacion(opciones) {
  const pagina = Number(opciones?.pagina ?? 1);
  const limite = Number(opciones?.limite ?? 10);

  if (!Number.isInteger(pagina) || pagina < 1) {
    throw crearError('La página debe ser un entero positivo.', 400);
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 50) {
    throw crearError('El límite debe ser un entero entre 1 y 50.', 400);
  }

  return {pagina, limite};
}

function crearClave(usuarioId, fecha) {
  return `${usuarioId}:${fecha}`;
}

function agruparPorUsuario(registros) {
  const mapa = new Map();

  for (const registro of registros) {
    const usuarioId = Number(registro.usuario_id);
    const actuales = mapa.get(usuarioId) || [];
    actuales.push(registro);
    mapa.set(usuarioId, actuales);
  }

  return mapa;
}

function crearMapaPorFecha(registros, campoFecha) {
  const mapa = new Map();

  for (const registro of registros) {
    const clave = crearClave(registro.usuario_id, registro[campoFecha]);

    if (!mapa.has(clave)) {
      mapa.set(clave, registro);
    }
  }

  return mapa;
}

function buscarHorario(horarios, fecha, diaSemana) {
  return horarios.find(horario =>
    String(horario.dia_semana).toLowerCase() === diaSemana &&
    horario.vigente_desde <= fecha &&
    (!horario.vigente_hasta || horario.vigente_hasta >= fecha)
  ) || null;
}

function obtenerHorarioEsperado(usuarioId, fecha, horarios, cambios) {
  const cambio = cambios.get(crearClave(usuarioId, fecha));

  if (cambio) {
    return {
      hora_entrada: cambio.hora_entrada_solicitada,
      hora_salida: cambio.hora_salida_solicitada
    };
  }

  const diaSemana = obtenerDiaSemanaDeFecha(fecha);
  const horario = buscarHorario(horarios, fecha, diaSemana);

  if (!horario) return null;

  return {
    hora_entrada: horario.hora_entrada,
    hora_salida: horario.hora_salida
  };
}

function agregarAlerta(alertas, actor, usuario, tipo, fecha, titulo, mensaje, severidad, datos = {}) {
  const periodo = tipo === 'ASISTENCIA_BAJA'
    ? fecha.substring(0, 7)
    : fecha;

  alertas.push({
    id: `${tipo}:${usuario.id}:${periodo}`,
    tipo,
    severidad,
    titulo,
    mensaje,
    fecha,
    ambito: Number(actor.id) === Number(usuario.id)
      ? 'PROPIO'
      : actor.role === 'supervisor' ? 'EQUIPO' : 'GLOBAL',
    usuario: {
      id: Number(usuario.id),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      role: String(usuario.role).toLowerCase()
    },
    ...datos
  });
}

function procesarUsuario({
  actor,
  usuario,
  fechas,
  fechaActual,
  horaActual,
  inicioIncidencias,
  inicioMes,
  horarios,
  asistencias,
  cambios,
  alertas
}) {
  const nombre = `${usuario.nombre} ${usuario.apellido}`;
  const horariosUsuario = horarios.get(Number(usuario.id)) || [];

  const tieneCronogramaVigente = horariosUsuario.some(horario =>
    horario.vigente_desde <= fechaActual &&
    (!horario.vigente_hasta || horario.vigente_hasta >= fechaActual)
  );

  if (!tieneCronogramaVigente) {
    agregarAlerta(
      alertas,
      actor,
      usuario,
      'SIN_CRONOGRAMA',
      fechaActual,
      'Sin cronograma vigente',
      `${nombre} no tiene un cronograma vigente.`,
      'ALTA'
    );
  }

  let jornadasEvaluadas = 0;
  let jornadasConEntrada = 0;

  for (const fecha of fechas) {
    const clave = crearClave(usuario.id, fecha);
    const asistencia = asistencias.get(clave) || null;
    const horariosEsperados = obtenerHorarioEsperado(
      usuario.id,
      fecha,
      horariosUsuario,
      cambios
    );

    const jornadaFinalizada = fecha < fechaActual || (
      fecha === fechaActual &&
      horariosEsperados &&
      horaASegundos(horaActual) > horaASegundos(horariosEsperados.hora_salida)
    );

    if (fecha >= inicioMes && horariosEsperados && (asistencia?.hora_entrada || jornadaFinalizada)) {
      jornadasEvaluadas++;

      if (asistencia?.hora_entrada) {
        jornadasConEntrada++;
      }
    }

    if (fecha < inicioIncidencias) continue;

    if (asistencia?.hora_entrada && String(asistencia.estado).toUpperCase() === 'TARDE') {
      agregarAlerta(
        alertas,
        actor,
        usuario,
        'TARDANZA',
        fecha,
        'Llegada tarde',
        `${nombre} registró una llegada tarde el ${fecha}.`,
        'MEDIA'
      );
    }

    if (horariosEsperados && !asistencia?.hora_entrada && jornadaFinalizada) {
      agregarAlerta(
        alertas,
        actor,
        usuario,
        'AUSENCIA',
        fecha,
        'Ausencia',
        `${nombre} no registró entrada el ${fecha}.`,
        'ALTA'
      );
    }

    if (asistencia?.hora_entrada && !asistencia.hora_salida && jornadaFinalizada) {
      agregarAlerta(
        alertas,
        actor,
        usuario,
        'JORNADA_INCOMPLETA',
        fecha,
        'Jornada incompleta',
        `${nombre} no registró salida el ${fecha}.`,
        'MEDIA'
      );
    }
  }

  if (jornadasEvaluadas >= JORNADAS_MINIMAS) {
    const porcentaje = Number(
      ((jornadasConEntrada / jornadasEvaluadas) * 100).toFixed(2)
    );

    if (porcentaje < PORCENTAJE_MINIMO) {
      agregarAlerta(
        alertas,
        actor,
        usuario,
        'ASISTENCIA_BAJA',
        fechaActual,
        'Asistencia mensual baja',
        `${nombre} registra ${porcentaje}% de asistencia este mes.`,
        'ALTA',
        {porcentaje, jornadas_evaluadas: jornadasEvaluadas}
      );
    }
  }
}

exports.obtenerAlertas = async (actorToken, opciones = {}) => {
  const actorId = Number(actorToken?.id);

  if (!Number.isInteger(actorId) || actorId < 1) {
    throw crearError('Usuario autenticado inválido.', 401);
  }

  const {pagina, limite} = validarPaginacion(opciones);
  const actor = await alertaModel.getActorConRol(actorId);

  if (!actor || !Boolean(actor.estado)) {
    throw crearError('El usuario autenticado no existe o está inactivo.', 401);
  }

  actor.role = String(actor.role || '').trim().toLowerCase();

  if (!['empleado', 'supervisor', 'rrhh', 'admin'].includes(actor.role)) {
    throw crearError('No tiene permisos para consultar alertas.', 403);
  }

  const {fecha: fechaActual, hora: horaActual} = obtenerFechaHoraActual();
  const inicioMes = obtenerRangoMes(fechaActual, 0).fechaDesde;
  const inicioIncidencias = sumarDiasAFecha(fechaActual, -(DIAS_INCIDENCIAS - 1));
  const fechaDesde = inicioMes < inicioIncidencias ? inicioMes : inicioIncidencias;
  const usuarios = await alertaModel.getUsuariosVisibles(actor.id, actor.role);
  const usuarioIds = usuarios.map(usuario => Number(usuario.id));

  const [asistencias, horarios, cambios] = await Promise.all([
    alertaModel.getAsistencias(usuarioIds, fechaDesde, fechaActual),
    alertaModel.getHorarios(usuarioIds, fechaDesde, fechaActual),
    alertaModel.getCambiosAprobados(usuarioIds, fechaDesde, fechaActual)
  ]);

  const datos = {
    asistencias: crearMapaPorFecha(asistencias, 'fecha'),
    horarios: agruparPorUsuario(horarios),
    cambios: crearMapaPorFecha(cambios, 'fecha_solicitada')
  };

  const fechas = obtenerFechasEntre(fechaDesde, fechaActual);
  const alertas = [];

  for (const usuario of usuarios) {
    procesarUsuario({
      actor,
      usuario,
      fechas,
      fechaActual,
      horaActual,
      inicioIncidencias,
      inicioMes,
      ...datos,
      alertas
    });
  }

  const prioridad = {ALTA: 0, MEDIA: 1};

  alertas.sort((a, b) =>
    b.fecha.localeCompare(a.fecha) ||
    prioridad[a.severidad] - prioridad[b.severidad] ||
    a.usuario.apellido.localeCompare(b.usuario.apellido, 'es') ||
    a.id.localeCompare(b.id)
  );

  const total = alertas.length;
  const inicio = (pagina - 1) * limite;

  return {
    pagina,
    limite,
    total,
    total_paginas: Math.ceil(total / limite),
    generado_en: new Date().toISOString(),
    alertas: alertas.slice(inicio, inicio + limite)
  };
};