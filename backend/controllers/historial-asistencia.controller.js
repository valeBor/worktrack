const historialAsistenciaService = require(
  '../services/historial-asistencia.service'
);

// ======================================================
// RESPONDER ERROR
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

  return res.status(statusCode).json({
    mensaje:
      statusCode === 500
        ? mensajePredeterminado
        : error.message
  });
}

// ======================================================
// OBTENER MI HISTORIAL
// ======================================================

exports.obtenerMiHistorial = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const {periodo} = req.query;

    const historial =
      await historialAsistenciaService
        .obtenerMiHistorial(
          usuarioId,
          periodo
        );

    return res.status(200).json(
      historial
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error interno al obtener el historial de asistencia.'
    );
  }
};

// ======================================================
// OBTENER USUARIOS GESTIONABLES
// ======================================================

exports.obtenerUsuariosGestionables = async (
  req,
  res
) => {
  try {
    const usuarioId = req.user?.id;

    const usuarios =
      await historialAsistenciaService
        .obtenerUsuariosGestionables(
          usuarioId
        );

    return res.status(200).json(
      usuarios
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error interno al obtener los usuarios disponibles para el historial.'
    );
  }
};

// ======================================================
// OBTENER HISTORIAL DE UN USUARIO
// ======================================================

exports.obtenerHistorialUsuario = async (
  req,
  res
) => {
  try {
    const actorId = req.user?.id;
    const {usuarioId} = req.params;
    const {periodo} = req.query;

    const historial =
      await historialAsistenciaService
        .obtenerHistorialUsuario(
          actorId,
          usuarioId,
          periodo
        );

    return res.status(200).json(
      historial
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error interno al obtener el historial del usuario.'
    );
  }
};