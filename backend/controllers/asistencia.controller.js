const asistenciaService =
  require("../services/asistencia.service");

// ==========================================================
// REGISTRAR ASISTENCIA
// ==========================================================

exports.registrar = async (req, res) => {

  try {

    const {
      token,
      tipo
    } = req.body;

    // Usuario obtenido desde JWT.
    const usuarioId =
      req.user?.id;

    // IP obtenida desde la petición.
    const ipDetectada =
      req.ip ||
      req.socket.remoteAddress;

    console.log(
      "IP detectada:",
      ipDetectada
    );

    const resultado =
      await asistenciaService.registrarAsistencia({
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
          error.message ||
          "Error al registrar asistencia"
      });
  }
};

// ==========================================================
// OBTENER MI ASISTENCIA DE HOY
// ==========================================================

exports.obtenerMiAsistenciaHoy =
  async (req, res) => {

    try {

      // No recibimos el usuario desde Angular.
      // Sale del JWT.
      const usuarioId =
        req.user?.id;

      const resultado =
        await asistenciaService
          .obtenerMiAsistenciaHoy(
            usuarioId
          );

      return res
        .status(200)
        .json(resultado);

    } catch (error) {

      console.error(
        "Error al obtener asistencia de hoy:",
        error
      );

      return res
        .status(
          error.statusCode || 500
        )
        .json({
          mensaje:
            error.message ||
            "Error al obtener asistencia de hoy"
        });
    }
  };