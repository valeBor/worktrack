const asistenciaService =
  require("../services/asistencia.service");


exports.registrar = async (
  req,
  res
) => {

  try {


    /*
     * Datos enviados por Angular.
     *
     * tipo:
     * entrada / salida
     *
     * token:
     * QR escaneado
     */
    const {
      token,
      tipo
    } = req.body;


    /*
     * El usuario NO viene
     * desde Angular.
     *
     * Lo obtiene nuestro
     * authMiddleware mediante JWT.
     */
    const usuarioId =
      req.user?.id;


    /*
     * La IP tampoco viene
     * desde Angular.
     *
     * La detectamos directamente
     * desde la petición.
     */
    const ipDetectada =
      req.ip
      ||
      req.socket.remoteAddress;

      console.log("IP detectada:", ipDetectada);


    const resultado =
      await asistenciaService
        .registrarAsistencia({

          usuarioId,

          tipo,

          token,

          ipDetectada

        });


    return res
      .status(201)
      .json(resultado);


  } catch (error) {


    console.error(
      "Error al registrar asistencia:",
      error
    );


    return res
      .status(
        error.statusCode || 400
      )
      .json({

        mensaje:
          error.message
          ||
          "Error al registrar asistencia"

      });


  }

};