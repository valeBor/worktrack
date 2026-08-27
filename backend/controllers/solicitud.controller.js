const solicitudService = require(
  '../services/solicitud.service'
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

  return res.status(
    error.statusCode || 500
  ).json({
    mensaje:
      error.message ||
      mensajePredeterminado
  });
}


// ======================================================
// CREAR MI SOLICITUD
// ======================================================

exports.createSolicitud = async (
  req,
  res
) => {
  try {
    const resultado =
      await solicitudService
        .createSolicitud(
          req.user,
          req.body
        );

    return res.status(201).json(
      resultado
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al crear la solicitud de cambio de horario.'
    );
  }
};

// ======================================================
// OBTENER MI HORARIO PARA UNA FECHA
// ======================================================

exports.getMiHorarioParaFecha = async (
  req,
  res
) => {
  try {
    const {
      fecha
    } = req.query;

    const horario =
      await solicitudService
        .getMiHorarioParaFecha(
          req.user,
          fecha
        );

    return res.json(
      horario
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener el horario para la fecha seleccionada.'
    );
  }
};


// ======================================================
// OBTENER MIS SOLICITUDES
// ======================================================

exports.getMisSolicitudes = async (
  req,
  res
) => {
  try {
    const solicitudes =
      await solicitudService
        .getMisSolicitudes(
          req.user
        );

    return res.json(
      solicitudes
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener las solicitudes del empleado.'
    );
  }
};


// ======================================================
// OBTENER SOLICITUDES PENDIENTES
// ======================================================

exports.getSolicitudesPendientes = async (
  req,
  res
) => {
  try {
    const solicitudes =
      await solicitudService
        .getSolicitudesPendientes(
          req.user
        );

    return res.json(
      solicitudes
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener las solicitudes pendientes.'
    );
  }
};


// ======================================================
// APROBAR O RECHAZAR SOLICITUD
// ======================================================

exports.resolveSolicitud = async (
  req,
  res
) => {
  try {
    const {
      solicitudId
    } = req.params;

    const resultado =
      await solicitudService
        .resolveSolicitud(
          req.user,
          solicitudId,
          req.body
        );

    return res.json(
      resultado
    );
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al resolver la solicitud.'
    );
  }
};