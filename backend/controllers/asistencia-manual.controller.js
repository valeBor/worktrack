const manualService = require('../services/asistencia-manual.service');

function responderError(res, error) {
  const status = error.statusCode || 500;
  if (status === 500) console.error('Error en asistencia manual:', error);

  return res.status(status).json({
    mensaje: status === 500
      ? 'Error interno al gestionar la asistencia manual.'
      : error.message
  });
}

exports.obtenerUsuariosGestionables = async (req, res) => {
  try {
    const usuarios = await manualService.obtenerUsuariosGestionables(
      req.user?.id
    );
    return res.status(200).json(usuarios);
  } catch (error) {
    return responderError(res, error);
  }
};

exports.obtenerContexto = async (req, res) => {
  try {
    const contexto = await manualService.obtenerContexto(
      req.user?.id,
      req.params.usuarioId
    );
    return res.status(200).json(contexto);
  } catch (error) {
    return responderError(res, error);
  }
};

exports.registrar = async (req, res) => {
  try {
    const resultado = await manualService.registrar({
      actorId: req.user?.id,
      usuarioId: req.body?.usuario_id,
      fecha: req.body?.fecha,
      horaEntrada: req.body?.hora_entrada,
      horaSalida: req.body?.hora_salida,
      contingencia: req.body?.contingencia,
      motivo: req.body?.motivo,
      ipActor: req.ip || req.socket.remoteAddress
    });

    const status = resultado.accion === 'CREACION_MANUAL' ? 201 : 200;
    return res.status(status).json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
};
exports.obtenerRegistros = async (req, res) => {
  try {
    const registros = await manualService.obtenerRegistrosGestionables(
      req.user?.id
    );
    return res.status(200).json(registros);
  } catch (error) {
    return responderError(res, error);
  }
};

exports.completarSalidaPendiente = async (req, res) => {
  try {
    const resultado = await manualService.completarSalidaPendiente({
      actorId: req.user?.id,
      asistenciaId: req.params.asistenciaId,
      horaSalida: req.body?.hora_salida,
      contingencia: req.body?.contingencia,
      motivo: req.body?.motivo,
      ipActor: req.ip || req.socket.remoteAddress
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
};