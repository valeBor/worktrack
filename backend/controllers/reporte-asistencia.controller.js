const reporteAsistenciaService = require(
  '../services/reporte-asistencia.service'
);

// ======================================================
// RESPONDER ERRORES
// ======================================================

function responderError(
  res,
  error,
  mensajePredeterminado
) {
  console.error(
    mensajePredeterminado,
    error
  );

  const statusCode =
    error.statusCode || 500;

  return res
    .status(statusCode)
    .json({
      mensaje:
        statusCode === 500
          ? mensajePredeterminado
          : error.message
    });
}

// ======================================================
// OBTENER USUARIOS REPORTABLES
// ======================================================

exports.obtenerUsuariosReportables =
  async (req, res) => {
    try {
      const usuarios =
        await reporteAsistenciaService
          .obtenerUsuariosReportables(
            req.user
          );

      return res
        .status(200)
        .json(usuarios);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener los usuarios reportables.'
      );
    }
  };

// ======================================================
// OBTENER REPORTE DIARIO
// ======================================================

exports.obtenerReporteDiario =
  async (req, res) => {
    try {
      const {fecha} = req.query;

      const reporte =
        await reporteAsistenciaService
          .obtenerReporteDiario(
            req.user,
            fecha
          );

      return res
        .status(200)
        .json(reporte);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener el reporte diario.'
      );
    }
  };

// ======================================================
// OBTENER HISTORIAL GLOBAL
// ======================================================

exports.obtenerHistorial =
  async (req, res) => {
    try {
      const {
        fechaDesde,
        fechaHasta,
        usuarioId,
        role,
        estado
      } = req.query;

      const historial =
        await reporteAsistenciaService
          .obtenerHistorial(
            req.user,
            {
              fechaDesde,
              fechaHasta,
              usuarioId,
              role,
              estado
            }
          );

      return res
        .status(200)
        .json(historial);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener el historial global de asistencia.'
      );
    }
  };

// ======================================================
// OBTENER ESTADÍSTICAS
// ======================================================

exports.obtenerEstadisticas =
  async (req, res) => {
    try {
      const {
        fechaDesde,
        fechaHasta,
        usuarioId,
        role
      } = req.query;

      const estadisticas =
        await reporteAsistenciaService
          .obtenerEstadisticas(
            req.user,
            {
              fechaDesde,
              fechaHasta,
              usuarioId,
              role
            }
          );

      return res
        .status(200)
        .json(estadisticas);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener las estadísticas de asistencia.'
      );
    }
  };