const notificacionService = require(
  '../services/notificacion.service'
);

// ======================================================
// RESPONDER ERRORES
// ======================================================

function responderError(
  res,
  error,
  mensajePredeterminado
) {
  const statusCode =
    error.statusCode || 500;

  if (statusCode === 500) {
    console.error(
      mensajePredeterminado,
      error
    );
  }

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
// OBTENER NOTIFICACIONES PROPIAS
// ======================================================

exports.obtenerNotificaciones =
  async (req, res) => {
    try {
      const {
        pagina,
        limite,
        soloNoLeidas
      } = req.query;

      const resultado =
        await notificacionService
          .obtenerNotificaciones(
            req.user,
            {
              pagina,
              limite,
              soloNoLeidas
            }
          );

      return res
        .status(200)
        .json(resultado);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener las notificaciones.'
      );
    }
  };

// ======================================================
// OBTENER CONTADOR DE NO LEÍDAS
// ======================================================

exports.obtenerContador =
  async (req, res) => {
    try {
      const resultado =
        await notificacionService
          .obtenerContador(
            req.user
          );

      return res
        .status(200)
        .json(resultado);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al obtener el contador de notificaciones.'
      );
    }
  };

// ======================================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ======================================================

exports.marcarComoLeida =
  async (req, res) => {
    try {
      const resultado =
        await notificacionService
          .marcarComoLeida(
            req.user,
            req.params.notificacionId
          );

      return res
        .status(200)
        .json(resultado);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al marcar la notificación como leída.'
      );
    }
  };

// ======================================================
// MARCAR TODAS COMO LEÍDAS
// ======================================================

exports.marcarTodasComoLeidas =
  async (req, res) => {
    try {
      const resultado =
        await notificacionService
          .marcarTodasComoLeidas(
            req.user
          );

      return res
        .status(200)
        .json(resultado);
    } catch (error) {
      return responderError(
        res,
        error,
        'Error interno al marcar las notificaciones como leídas.'
      );
    }
  };