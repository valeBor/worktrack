const db = require(
  '../config/db'
);

const asistenciaModel = require(
  '../models/asistencia.model'
);

const solicitudModel = require(
  '../models/solicitud.model'
);

const {
  buscarRedAutorizada
} = require(
  './red.service'
);

const {
  normalizarIp
} = require(
  '../utils/ip.util'
);

const {
  obtenerFechaHoraActual,
  horaASegundos
} = require(
  '../utils/fecha.util'
);

const qrService = require(
  './qrService'
);


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
// REGISTRAR ASISTENCIA
// ======================================================

exports.registrarAsistencia = async ({
  usuarioId,
  tipo,
  token,
  ipDetectada
}) => {

  // ====================================================
  // 1. VALIDACIONES BÁSICAS
  // ====================================================

  if (!usuarioId) {
    throw crearError(
      'Usuario no autenticado',
      401
    );
  }

  if (
    tipo !== 'entrada'
    &&
    tipo !== 'salida'
  ) {
    throw crearError(
      'Tipo de registro inválido',
      400
    );
  }


  // ====================================================
  // 2. ABRIR CONEXIÓN
  // ====================================================

  const connection =
    await db.getConnection();


  try {

    await connection.beginTransaction();


    // ==================================================
    // 3. OBTENER FECHA, HORA Y DÍA
    // ==================================================

    const {
      fecha,
      hora,
      diaSemana
    } = obtenerFechaHoraActual();


    // ==================================================
    // 4. NORMALIZAR IP
    // ==================================================

    const ip =
      normalizarIp(ipDetectada);


    if (!ip) {
      throw crearError(
        'No fue posible detectar la red del dispositivo.',
        403
      );
    }


    // ==================================================
    // 5. BUSCAR HORARIO APLICABLE
    // ==================================================
    //
    // Primero se busca una solicitud aprobada
    // específicamente para la fecha actual.
    //
    // Si no existe, se utiliza el cronograma semanal.
    // ==================================================

    const cambioAprobado =
      await solicitudModel
        .getAprobadaByUsuarioAndFecha(
          connection,
          usuarioId,
          fecha
        );


    let horario;

    let origenHorario;

    let solicitudCambioId = null;


    if (cambioAprobado) {

      horario = {
        hora_entrada:
          cambioAprobado
            .hora_entrada_solicitada,

        hora_salida:
          cambioAprobado
            .hora_salida_solicitada,

        modalidad:
          cambioAprobado
            .modalidad_actual,

        tolerancia_minutos:
          cambioAprobado
            .tolerancia_actual
      };


      origenHorario =
        'SOLICITUD_APROBADA';


      solicitudCambioId =
        cambioAprobado.id;

    } else {

      horario =
        await asistenciaModel
          .buscarHorarioHoy(
            connection,
            usuarioId,
            diaSemana
          );


      origenHorario =
        'CRONOGRAMA_SEMANAL';

    }


    if (!horario) {
      throw crearError(
        'No tiene un horario asignado para el día de hoy.',
        403
      );
    }


    // ==================================================
    // 6. OBTENER Y VALIDAR MODALIDAD
    // ==================================================

    const modalidad =
      String(
        horario.modalidad
      ).toUpperCase();


    if (
      modalidad !== 'PRESENCIAL'
      &&
      modalidad !== 'HOME'
    ) {
      throw crearError(
        'La modalidad del horario no es válida.',
        500
      );
    }


    // ==================================================
    // 7. BUSCAR ASISTENCIA DEL DÍA
    // ==================================================

    const asistenciaHoy =
      await asistenciaModel
        .buscarAsistenciaPorFecha(
          connection,
          usuarioId,
          fecha
        );


    // ==================================================
    // 8. CONVERTIR HORARIOS A SEGUNDOS
    // ==================================================

    const horaActualSegundos =
      horaASegundos(hora);


    const horaEntradaSegundos =
      horaASegundos(
        horario.hora_entrada
      );


    const horaSalidaSegundos =
      horaASegundos(
        horario.hora_salida
      );


    // ==================================================
    // 9. CALCULAR TOLERANCIA
    // ==================================================

    const toleranciaSegundos =
      Number(
        horario.tolerancia_minutos || 0
      ) * 60;


    const inicioPermitido =
      horaEntradaSegundos
      -
      toleranciaSegundos;


    // ==================================================
    // 10. VALIDAR ENTRADA
    // ==================================================

    if (tipo === 'entrada') {

      // No puede registrar dos entradas.
      if (
        asistenciaHoy
        &&
        asistenciaHoy.hora_entrada
      ) {
        throw crearError(
          'Ya registraste la entrada de hoy.',
          409
        );
      }


      // No puede registrar demasiado temprano.
      if (
        horaActualSegundos
        <
        inicioPermitido
      ) {
        throw crearError(
          `Todavía no puede registrar la entrada. Su horario comienza a las ${horario.hora_entrada}.`,
          403
        );
      }


      // No puede registrar entrada
      // después de finalizado el turno.
      if (
        horaActualSegundos
        >
        horaSalidaSegundos
      ) {
        throw crearError(
          'El horario asignado para hoy ya finalizó.',
          403
        );
      }

    }


    // ==================================================
    // 11. VALIDAR SALIDA
    // ==================================================

    if (tipo === 'salida') {

      // No puede registrar una salida
      // sin una asistencia del día.
      if (!asistenciaHoy) {
        throw crearError(
          'No existe una entrada registrada para hoy.',
          400
        );
      }


      // Debe existir una entrada.
      if (!asistenciaHoy.hora_entrada) {
        throw crearError(
          'Debe registrar primero la entrada.',
          400
        );
      }


      // No puede registrar dos salidas.
      if (asistenciaHoy.hora_salida) {
        throw crearError(
          'Ya registraste la salida de hoy.',
          409
        );
      }

    }


    // ==================================================
    // 12. DETERMINAR TIPO DE RED
    // ==================================================

    const tipoRedRequerida =
      modalidad === 'PRESENCIAL'
        ? 'LOCAL'
        : 'VPN';


    // ==================================================
    // 13. VALIDAR RED
    // ==================================================

    const redAutorizada =
      await buscarRedAutorizada(
        tipoRedRequerida,
        ip,
        connection
      );


    if (!redAutorizada) {

      if (modalidad === 'PRESENCIAL') {
        throw crearError(
          'Debe estar conectado a una red local autorizada.',
          403
        );
      }


      throw crearError(
        'Debe estar conectado a la VPN autorizada.',
        403
      );

    }


    // ==================================================
    // 14. VALIDAR QR
    // ==================================================
    //
    // PRESENCIAL:
    // requiere un QR válido generado por el backend.
    //
    // HOME:
    // no requiere QR.
    // ==================================================

    if (modalidad === 'PRESENCIAL') {

      if (!token) {
        throw crearError(
          'Token QR requerido.',
          400
        );
      }


      const resultadoQr =
        qrService.validarQrDinamico(
          token
        );


      if (!resultadoQr.valido) {

        if (
          resultadoQr.motivo
          ===
          'TOKEN_VENCIDO'
        ) {
          throw crearError(
            'El código QR ha vencido.',
            403
          );
        }


        throw crearError(
          'El código QR es inválido.',
          403
        );

      }

    }


    // ==================================================
    // 15. REGISTRAR ENTRADA
    // ==================================================

    if (tipo === 'entrada') {

      const limiteTolerancia =
        horaEntradaSegundos
        +
        toleranciaSegundos;


      const estado =
        horaActualSegundos
        <=
        limiteTolerancia
          ? 'PRESENTE'
          : 'TARDE';


      const resultado =
        await asistenciaModel
          .registrarEntrada(
            connection,
            usuarioId,
            redAutorizada.id,
            fecha,
            hora,
            modalidad,
            null,
            ip,
            estado
          );


      await connection.commit();


      return {
        mensaje:
          'Entrada registrada correctamente',

        accion:
          'ENTRADA',

        asistenciaId:
          resultado.insertId,

        fecha,

        hora,

        modalidad,

        estado,

        origenHorario,

        solicitudCambioId,

        horarioAplicado: {
          hora_entrada:
            horario.hora_entrada,

          hora_salida:
            horario.hora_salida,

          tolerancia_minutos:
            Number(
              horario.tolerancia_minutos || 0
            )
        },

        ipDetectada:
          ip,

        red: {
          id:
            redAutorizada.id,

          nombre:
            redAutorizada.nombre,

          tipo:
            redAutorizada.tipo
        }
      };

    }


    // ==================================================
    // 16. REGISTRAR SALIDA
    // ==================================================

    if (tipo === 'salida') {

      await asistenciaModel
        .registrarSalida(
          connection,
          asistenciaHoy.id,
          hora,
          redAutorizada.id,
          ip
        );


      await connection.commit();


      return {
        mensaje:
          'Salida registrada correctamente',

        accion:
          'SALIDA',

        asistenciaId:
          asistenciaHoy.id,

        fecha,

        hora,

        modalidad,

        origenHorario,

        solicitudCambioId,

        horarioAplicado: {
          hora_entrada:
            horario.hora_entrada,

          hora_salida:
            horario.hora_salida,

          tolerancia_minutos:
            Number(
              horario.tolerancia_minutos || 0
            )
        },

        ipDetectada:
          ip,

        red: {
          id:
            redAutorizada.id,

          nombre:
            redAutorizada.nombre,

          tipo:
            redAutorizada.tipo
        }
      };

    }

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }

};


// ======================================================
// OBTENER MI ASISTENCIA DE HOY
// ======================================================

exports.obtenerMiAsistenciaHoy = async (
  usuarioId
) => {

  if (!usuarioId) {
    throw crearError(
      'Usuario no autenticado',
      401
    );
  }


  // Utiliza la misma fecha configurada
  // para el registro de asistencia.
  const {
    fecha
  } = obtenerFechaHoraActual();


  const asistencia =
    await asistenciaModel
      .buscarAsistenciaPorFecha(
        null,
        usuarioId,
        fecha
      );


  // ====================================================
  // TODAVÍA NO REGISTRÓ NADA
  // ====================================================

  if (!asistencia) {
    return {
      fecha,
      asistencia: null,
      proximaAccion:
        'entrada',
      jornadaCompletada:
        false
    };
  }


  // ====================================================
  // REGISTRÓ ENTRADA, PERO NO SALIDA
  // ====================================================

  if (
    asistencia.hora_entrada
    &&
    !asistencia.hora_salida
  ) {
    return {
      fecha,
      asistencia,
      proximaAccion:
        'salida',
      jornadaCompletada:
        false
    };
  }


  // ====================================================
  // YA REGISTRÓ ENTRADA Y SALIDA
  // ====================================================

  if (
    asistencia.hora_entrada
    &&
    asistencia.hora_salida
  ) {
    return {
      fecha,
      asistencia,
      proximaAccion:
        null,
      jornadaCompletada:
        true
    };
  }


  // Caso defensivo.
  return {
    fecha,
    asistencia,
    proximaAccion:
      'entrada',
    jornadaCompletada:
      false
  };

};