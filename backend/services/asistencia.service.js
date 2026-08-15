const db = require("../config/db");
const asistenciaModel = require("../models/asistencia.model");
const {buscarRedAutorizada} = require("./red.service");
const {normalizarIp} = require("../utils/ip.util");
const {obtenerFechaHoraActual,horaASegundos} = require("../utils/fecha.util");
const qrService = require("./qrService");


function crearError(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

exports.registrarAsistencia = async ({
  usuarioId,
  tipo,
  token,
  ipDetectada
}) => {

  // ========================================================
  // 1. VALIDACIONES BÁSICAS
  // ========================================================

  if (!usuarioId) {
    throw crearError(
      "Usuario no autenticado",
      401
    );
  }

  if (
    tipo !== "entrada" &&
    tipo !== "salida"
  ) {
    throw crearError(
      "Tipo de registro inválido",
      400
    );
  }


  // ========================================================
  // 2. ABRIR CONEXIÓN
  // ========================================================

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();


    // ======================================================
    // 3. OBTENER FECHA, HORA Y DÍA
    // ======================================================

    const {
      fecha,
      hora,
      diaSemana
    } = obtenerFechaHoraActual();


    // ======================================================
    // 4. NORMALIZAR IP
    // ======================================================

    const ip = normalizarIp(ipDetectada);

    if (!ip) {
      throw crearError(
        "No fue posible detectar la red del dispositivo.",
        403
      );
    }


    // ======================================================
    // 5. BUSCAR HORARIO DEL EMPLEADO
    // ======================================================

    const horario =
      await asistenciaModel.buscarHorarioHoy(
        connection,
        usuarioId,
        diaSemana
      );

    if (!horario) {
      throw crearError(
        "No tiene un horario asignado para el día de hoy.",
        403
      );
    }


    // ======================================================
    // 6. OBTENER MODALIDAD
    // ======================================================

    const modalidad =
      String(horario.modalidad).toUpperCase();

    if (
      modalidad !== "PRESENCIAL" &&
      modalidad !== "HOME"
    ) {
      throw crearError(
        "La modalidad del horario no es válida.",
        500
      );
    }


    // ======================================================
    // 7. BUSCAR ASISTENCIA DEL DÍA
    // ======================================================

    const asistenciaHoy =
      await asistenciaModel.buscarAsistenciaPorFecha(
        connection,
        usuarioId,
        fecha
      );


    // ======================================================
    // 8. CONVERTIR HORARIOS A SEGUNDOS
    // ======================================================

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


    // ======================================================
    // 9. CALCULAR TOLERANCIA
    // ======================================================

    const toleranciaSegundos =
      Number(
        horario.tolerancia_minutos || 0
      ) * 60;

    const inicioPermitido =
      horaEntradaSegundos -
      toleranciaSegundos;


    // ======================================================
    // 10. VALIDAR ENTRADA
    // ======================================================

    if (tipo === "entrada") {

      // No puede registrar dos entradas.
      if (
        asistenciaHoy &&
        asistenciaHoy.hora_entrada
      ) {
        throw crearError(
          "Ya registraste la entrada de hoy.",
          409
        );
      }

      // No puede entrar demasiado temprano.
      if (
        horaActualSegundos <
        inicioPermitido
      ) {
        throw crearError(
          `Todavía no puede registrar la entrada. Su horario comienza a las ${horario.hora_entrada}.`,
          403
        );
      }

      // No puede registrar entrada
      // después de terminado el turno.
      if (
        horaActualSegundos >
        horaSalidaSegundos
      ) {
        throw crearError(
          "El horario asignado para hoy ya finalizó.",
          403
        );
      }
    }


    // ======================================================
    // 11. VALIDAR SALIDA
    // ======================================================

    if (tipo === "salida") {

      // No puede haber salida sin registro del día.
      if (!asistenciaHoy) {
        throw crearError(
          "No existe una entrada registrada para hoy.",
          400
        );
      }

      // Debe existir entrada.
      if (!asistenciaHoy.hora_entrada) {
        throw crearError(
          "Debe registrar primero la entrada.",
          400
        );
      }

      // No puede registrar dos salidas.
      if (asistenciaHoy.hora_salida) {
        throw crearError(
          "Ya registraste la salida de hoy.",
          409
        );
      }
    }


    // ======================================================
    // 12. DETERMINAR TIPO DE RED
    // ======================================================

    const tipoRedRequerida =
      modalidad === "PRESENCIAL"
        ? "LOCAL"
        : "VPN";


    // ======================================================
    // 13. VALIDAR RED
    // ======================================================

    const redAutorizada =
      await buscarRedAutorizada(
        tipoRedRequerida,
        ip,
        connection
      );

    if (!redAutorizada) {

      if (modalidad === "PRESENCIAL") {
        throw crearError(
          "Debe estar conectado a una red local autorizada.",
          403
        );
      }

      throw crearError(
        "Debe estar conectado a la VPN autorizada.",
        403
      );
    }


    // ======================================================
    // 14. VALIDAR QR
    // ======================================================
    //
    // PRESENCIAL:
    // necesita QR válido generado por el backend.
    //
    // HOME:
    // NO necesita QR.
    // ======================================================

    if (modalidad === "PRESENCIAL") {

      if (!token) {
        throw crearError(
          "Token QR requerido.",
          400
        );
      }

      const resultadoQr =
        qrService.validarQrDinamico(
          token
        );

      if (!resultadoQr.valido) {

        if (
          resultadoQr.motivo ===
          "TOKEN_VENCIDO"
        ) {
          throw crearError(
            "El código QR ha vencido.",
            403
          );
        }

        throw crearError(
          "El código QR es inválido.",
          403
        );
      }
    }


    // ======================================================
    // 15. REGISTRAR ENTRADA
    // ======================================================

    if (tipo === "entrada") {

      const limiteTolerancia =
        horaEntradaSegundos +
        toleranciaSegundos;

      const estado =
        horaActualSegundos <=
        limiteTolerancia
          ? "PRESENTE"
          : "TARDE";

      const resultado =
        await asistenciaModel.registrarEntrada(
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
          "Entrada registrada correctamente",
        accion:
          "ENTRADA",
        asistenciaId:
          resultado.insertId,
        fecha,
        hora,
        modalidad,
        estado,
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


    // ======================================================
    // 16. REGISTRAR SALIDA
    // ======================================================

    if (tipo === "salida") {

      await asistenciaModel.registrarSalida(
        connection,
        asistenciaHoy.id,
        hora,
        redAutorizada.id,
        ip
      );

      await connection.commit();

      return {
        mensaje:
          "Salida registrada correctamente",
        accion:
          "SALIDA",
        asistenciaId:
          asistenciaHoy.id,
        fecha,
        hora,
        modalidad,
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

// ==========================================================
// OBTENER MI ASISTENCIA DE HOY
// ==========================================================

exports.obtenerMiAsistenciaHoy = async (usuarioId) => {

  if (!usuarioId) {
    throw crearError(
      "Usuario no autenticado",
      401
    );
  }

  // Obtenemos la fecha actual usando
  // la misma utilidad que utiliza registrarAsistencia.
  const { fecha } = obtenerFechaHoraActual();

  // Buscamos si este usuario ya tiene
  // asistencia registrada hoy.
  const asistencia =
    await asistenciaModel.buscarAsistenciaPorFecha(
      null,
      usuarioId,
      fecha
    );

  // ========================================================
  // TODAVÍA NO REGISTRÓ NADA
  // ========================================================

  if (!asistencia) {
    return {
      fecha,
      asistencia: null,
      proximaAccion: "entrada",
      jornadaCompletada: false
    };
  }

  // ========================================================
  // REGISTRÓ ENTRADA PERO NO SALIDA
  // ========================================================

  if (
    asistencia.hora_entrada &&
    !asistencia.hora_salida
  ) {
    return {
      fecha,
      asistencia,
      proximaAccion: "salida",
      jornadaCompletada: false
    };
  }

  // ========================================================
  // YA REGISTRÓ ENTRADA Y SALIDA
  // ========================================================

  if (
    asistencia.hora_entrada &&
    asistencia.hora_salida
  ) {
    return {
      fecha,
      asistencia,
      proximaAccion: null,
      jornadaCompletada: true
    };
  }

  // Caso defensivo.
  return {
    fecha,
    asistencia,
    proximaAccion: "entrada",
    jornadaCompletada: false
  };
};