const DIAS_SEMANA = {

  Sunday: "domingo",
  Monday: "lunes",
  Tuesday: "martes",
  Wednesday: "miercoles",
  Thursday: "jueves",
  Friday: "viernes",
  Saturday: "sabado"

};


/**
 * Obtiene fecha, hora y día
 * utilizando la zona horaria
 * configurada.
 */
function obtenerFechaHoraActual() {

  const zonaHoraria =
    process.env.APP_TIMEZONE
    ||
    "America/Argentina/Buenos_Aires";


  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: zonaHoraria,

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",

        weekday: "long",

        hourCycle: "h23"
      }
    )
    .formatToParts(
      new Date()
    );


  const valores = {};


  for (const parte of partes) {

    if (
      parte.type !== "literal"
    ) {

      valores[parte.type] =
        parte.value;

    }

  }


  return {

    fecha:
      `${valores.year}-${valores.month}-${valores.day}`,

    hora:
      `${valores.hour}:${valores.minute}:${valores.second}`,

    diaSemana:
      DIAS_SEMANA[
        valores.weekday
      ]

  };

}


/**
 * Convierte:
 *
 * 08:30:00
 *
 * a segundos.
 */
function horaASegundos(hora) {

  const partes =
    String(hora).split(":");


  const horas =
    Number(partes[0] || 0);

  const minutos =
    Number(partes[1] || 0);

  const segundos =
    Number(partes[2] || 0);


  return (
    horas * 3600
    +
    minutos * 60
    +
    segundos
  );

}


module.exports = {
  obtenerFechaHoraActual,
  horaASegundos
};