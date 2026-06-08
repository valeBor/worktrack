const asistenciaService = require("../services/asistencia.service");

exports.registrar = async (req, res) => {
  try {
    const { token, tipo } = req.body;

    // según respuesta del middleware de usuarios   
    const usuarioId = req.user?.id;

    const resultado = await asistenciaService.registrarAsistencia({
      usuarioId,
      token,
      tipo
    });

    res.status(201).json(resultado);

  } catch (error) {
    console.error("Error al registrar asistencia:", error);

    res.status(400).json({
      mensaje: error.message || "Error al registrar asistencia"
    });
  }
};