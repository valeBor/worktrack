const DIAS_SEMANA = {
  Sunday: 'domingo',
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miercoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sabado'
};

// ======================================================
// OBTENER FECHA, HORA Y DÍA ACTUALES
// ======================================================

function obtenerFechaHoraActual() {
  const zonaHoraria =
    process.env.APP_TIMEZONE ||
    'America/Argentina/Buenos_Aires';

  const partes = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      hourCycle: 'h23'
    }
  ).formatToParts(new Date());

  const valores = {};

  for (const parte of partes) {
    if (parte.type !== 'literal') {
      valores[parte.type] = parte.value;
    }
  }

  return {
    fecha:
      `${valores.year}-${valores.month}-${valores.day}`,
    hora:
      `${valores.hour}:${valores.minute}:${valores.second}`,
    diaSemana:
      DIAS_SEMANA[valores.weekday]
  };
}

// ======================================================
// OBTENER DÍA SEMANAL DE UNA FECHA
// ======================================================

function obtenerDiaSemanaDeFecha(fechaRecibida) {
  const fecha = String(
    fechaRecibida || ''
  ).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  const [anio, mes, dia] =
    fecha.split('-').map(Number);

  const fechaUtc = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
      12,
      0,
      0
    )
  );

  const fechaExiste =
    fechaUtc.getUTCFullYear() === anio &&
    fechaUtc.getUTCMonth() === mes - 1 &&
    fechaUtc.getUTCDate() === dia;

  if (!fechaExiste) {
    return null;
  }

  const nombreDia =
    new Intl.DateTimeFormat(
      'en-US',
      {
        weekday: 'long',
        timeZone: 'UTC'
      }
    ).format(fechaUtc);

  return DIAS_SEMANA[nombreDia] || null;
}

// ======================================================
// SUMAR O RESTAR DÍAS
// ======================================================

function sumarDiasAFecha(
  fecha,
  cantidadDias
) {
  if (
    !obtenerDiaSemanaDeFecha(fecha) ||
    !Number.isInteger(cantidadDias)
  ) {
    return null;
  }

  const [anio, mes, dia] =
    fecha.split('-').map(Number);

  const fechaUtc = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  fechaUtc.setUTCDate(
    fechaUtc.getUTCDate() + cantidadDias
  );

  return fechaUtc
    .toISOString()
    .substring(0, 10);
}

// ======================================================
// OBTENER RANGO DE UN MES
// ======================================================

function obtenerRangoMes(
  fecha,
  desplazamientoMeses = 0
) {
  if (
    !obtenerDiaSemanaDeFecha(fecha) ||
    !Number.isInteger(desplazamientoMeses)
  ) {
    return null;
  }

  const [anio, mes] =
    fecha.split('-').map(Number);

  const primerDia = new Date(
    Date.UTC(
      anio,
      mes - 1 + desplazamientoMeses,
      1
    )
  );

  const ultimoDia = new Date(
    Date.UTC(
      primerDia.getUTCFullYear(),
      primerDia.getUTCMonth() + 1,
      0
    )
  );

  return {
    fechaDesde:
      primerDia
        .toISOString()
        .substring(0, 10),
    fechaHasta:
      ultimoDia
        .toISOString()
        .substring(0, 10)
  };
}

// ======================================================
// OBTENER FECHAS INCLUIDAS EN UN PERÍODO
// ======================================================

function obtenerFechasEntre(
  fechaDesde,
  fechaHasta
) {
  if (
    !obtenerDiaSemanaDeFecha(fechaDesde) ||
    !obtenerDiaSemanaDeFecha(fechaHasta) ||
    fechaDesde > fechaHasta
  ) {
    return [];
  }

  const fechas = [];
  let fechaActual = fechaDesde;

  while (fechaActual <= fechaHasta) {
    fechas.push(fechaActual);

    fechaActual = sumarDiasAFecha(
      fechaActual,
      1
    );
  }

  return fechas;
}

// ======================================================
// CONVERTIR HORA A SEGUNDOS
// ======================================================

function horaASegundos(hora) {
  const partes = String(
    hora || ''
  ).split(':');

  const horas = Number(partes[0] || 0);
  const minutos = Number(partes[1] || 0);
  const segundos = Number(partes[2] || 0);

  return (
    horas * 3600 +
    minutos * 60 +
    segundos
  );
}

// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {
  obtenerFechaHoraActual,
  obtenerDiaSemanaDeFecha,
  sumarDiasAFecha,
  obtenerRangoMes,
  obtenerFechasEntre,
  horaASegundos
};