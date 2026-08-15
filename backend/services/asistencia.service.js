const db = require("../config/db");

const asistenciaModel = require("../models/asistencia.model");

const {
  buscarRedAutorizada
} = require("./red.service");

const {
  normalizarIp
} = require("../utils/ip.util");

const {
  obtenerFechaHoraActual,
  horaASegundos
} = require("../utils/fecha.util");


// ==========================================================
// QR SERVICE
// ==========================================================
//
// Por ahora queda comentado.
//
// qr.service.js actualmente genera el QR,
// pero todavía no tiene una función para validar
// si el token existe y si venció.
//
// Cuando agreguemos validarQrDinamico(token),
// volvemos a habilitar este require.
//
// const qrService = require("./qr.service");


// ==========================================================
// FUNCIÓN AUXILIAR PARA CREAR ERRORES
// ==========================================================

function crearError(mensaje, statusCode = 400) {

  const error = new Error(mensaje);

  error.statusCode = statusCode;

  return error;
}


// ==========================================================
// REGISTRAR ASISTENCIA
// ==========================================================
//
// Recibe:
//
// usuarioId:
// viene del JWT.
//
// tipo:
// "entrada" o "salida".
//
// token:
// token obtenido del código QR.
//
// ipDetectada:
// IP obtenida por el controller desde la petición.
//
// ==========================================================

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
  //
  // Utilizamos una conexión porque vamos a trabajar
  // con una transacción.
  //
  // Si alguna validación o consulta falla,
  // se hace rollback.
  //

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
    //
    // Puede ser:
    //
    // PRESENCIAL
    // HOME
    //

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
    //
    // Nos permite saber si:
    //
    // - todavía no registró
    // - ya registró entrada
    // - ya registró entrada y salida
    //

    const asistenciaHoy =
      await asistenciaModel.buscarAsistenciaPorFecha(
        connection,
        usuarioId,
        fecha
      );


    // ======================================================
    // 8. CONVERTIR HORARIOS A SEGUNDOS
    // ======================================================
    //
    // Ejemplo:
    //
    // 08:00:00
    //
    // se convierte a segundos para poder comparar
    // fácilmente las horas.
    //

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


    // Ejemplo:
    //
    // entrada = 08:00
    // tolerancia = 10 minutos
    //
    // puede registrar desde 07:50.

    const inicioPermitido =
      horaEntradaSegundos -
      toleranciaSegundos;


    // ======================================================
    // 10. VALIDAR ENTRADA
    // ======================================================

    if (tipo === "entrada") {


      // Ya tiene entrada registrada.

      if (
        asistenciaHoy &&
        asistenciaHoy.hora_entrada
      ) {

        throw crearError(
          "Ya registraste la entrada de hoy.",
          409
        );

      }


      // Intenta ingresar demasiado temprano.

      if (
        horaActualSegundos <
        inicioPermitido
      ) {

        throw crearError(
          `Todavía no puede registrar la entrada. Su horario comienza a las ${horario.hora_entrada}.`,
          403
        );

      }


      // El turno ya terminó.

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


      // No existe ninguna asistencia hoy.

      if (!asistenciaHoy) {

        throw crearError(
          "No existe una entrada registrada para hoy.",
          400
        );

      }


      // Existe registro pero no tiene entrada.

      if (!asistenciaHoy.hora_entrada) {

        throw crearError(
          "Debe registrar primero la entrada.",
          400
        );

      }


      // Ya tiene salida.

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
    //
    // PRESENCIAL
    //      ↓
    // LOCAL
    //
    // HOME
    //      ↓
    // VPN
    //

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
    // Por ahora:
    //
    // PRESENCIAL exige que venga un token.
    //
    // Pero todavía NO verificamos:
    //
    // - que haya sido generado por el servidor
    // - que no haya vencido
    //
    // Eso será el próximo paso.
    //

    if (modalidad === "PRESENCIAL") {


      if (!token) {

        throw crearError(
          "Token QR requerido.",
          400
        );

      }


      // ====================================================
      // VALIDACIÓN REAL DEL QR - PENDIENTE
      // ====================================================
      //
      // Cuando modifiquemos qr.service.js,
      // vamos a habilitar algo similar a:
      //
      //
      // const resultadoQr =
      //   await qrService.validarQrDinamico(token);
      //
      //
      // if (!resultadoQr.valido) {
      //
      //   throw crearError(
      //     "El código QR es inválido o ha vencido.",
      //     403
      //   );
      //
      // }
      //
      // ====================================================

    }


    // ======================================================
    // 15. REGISTRAR ENTRADA
    // ======================================================

    if (tipo === "entrada") {


      // Hora máxima para considerar que está
      // dentro de la tolerancia.

      const limiteTolerancia =
        horaEntradaSegundos +
        toleranciaSegundos;


      // Si pasa la tolerancia queda TARDE.

      const estado =
        horaActualSegundos <= limiteTolerancia
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


      // Todas las operaciones fueron correctas.

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

    // Si algo falló, deshacemos la transacción.

    await connection.rollback();

    throw error;


  } finally {
    // Liberamos siempre la conexión.
    connection.release();
  }

};