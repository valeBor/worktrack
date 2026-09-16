const alertaService = require('../services/alerta.service');

exports.obtenerAlertas = async (req, res) => {
  try {
    const resultado = await alertaService.obtenerAlertas(
      req.user,
      {
        pagina: req.query.pagina,
        limite: req.query.limite
      }
    );

    return res.status(200).json(resultado);
  } catch (error) {
    const statusCode = [400, 401, 403, 404, 409].includes(error.statusCode)
      ? error.statusCode
      : 500;

    if (statusCode === 500) {
      console.error('Error al obtener alertas:', error);
    }

    return res.status(statusCode).json({
      mensaje: statusCode === 500
        ? 'Error interno al obtener las alertas.'
        : error.message
    });
  }
};