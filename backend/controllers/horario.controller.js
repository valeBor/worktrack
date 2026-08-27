const horarioService = require(
  '../services/horario.service'
);

// ======================================================
// RESPONDER ERROR
// ======================================================

function responderError(
  res,
  error,
  mensajePredeterminado
) {
  console.error(mensajePredeterminado, error);

  return res.status(
    error.statusCode || 500
  ).json({
    mensaje:
      error.message ||
      mensajePredeterminado
  });
}

// ======================================================
// USUARIOS GESTIONABLES
// ======================================================

exports.getUsuariosGestionables = async (
  req,
  res
) => {
  try {
    const usuarios =
      await horarioService
        .getUsuariosGestionables(req.user);

    return res.json(usuarios);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener los usuarios gestionables.'
    );
  }
};

// ======================================================
// OBTENER HORARIOS PERMITIDOS
// ======================================================

exports.getHorarios = async (req, res) => {
  try {
    const horarios =
      await horarioService.getHorarios(
        req.user
      );

    return res.json(horarios);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener horarios.'
    );
  }
};

// ======================================================
// OBTENER HORARIOS DE UN USUARIO
// ======================================================

exports.getHorariosUsuario = async (
  req,
  res
) => {
  try {
    const { usuarioId } = req.params;

    const horarios =
      await horarioService
        .getHorariosUsuario(
          req.user,
          usuarioId
        );

    return res.json(horarios);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener los horarios del usuario.'
    );
  }
};

// ======================================================
// OBTENER MI HORARIO DE HOY
// ======================================================

exports.getMiHorarioHoy = async (
  req,
  res
) => {
  try {
    const horario =
      await horarioService
        .getMiHorarioHoy(req.user?.id);

    return res.json(horario);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al obtener el horario de hoy.'
    );
  }
};

// ======================================================
// CREAR CRONOGRAMA
// ======================================================

exports.createHorario = async (
  req,
  res
) => {
  try {
    const resultado =
      await horarioService.createHorario(
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
      'Error al crear el cronograma.'
    );
  }
};

// ======================================================
// ACTUALIZAR CRONOGRAMA COMPLETO
// ======================================================

exports.updateCronogramaUsuario = async (
  req,
  res
) => {
  try {
    const { usuarioId } = req.params;

    const resultado =
      await horarioService
        .updateCronogramaUsuario(
          req.user,
          usuarioId,
          req.body
        );

    return res.json(resultado);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al actualizar el cronograma.'
    );
  }
};

// ======================================================
// ELIMINAR CRONOGRAMA COMPLETO
// ======================================================

exports.deleteCronogramaUsuario = async (
  req,
  res
) => {
  try {
    const { usuarioId } = req.params;

    const resultado =
      await horarioService
        .deleteCronogramaUsuario(
          req.user,
          usuarioId
        );

    return res.json(resultado);
  } catch (error) {
    return responderError(
      res,
      error,
      'Error al eliminar el cronograma.'
    );
  }
};