const horarioService = require("../services/horario.service");

// ======================================================
// GET TODOS
// ======================================================

exports.getHorarios =
  async (req, res) => {

    try {

      const horarios =
        await horarioService
          .getHorarios();


      return res.json(
        horarios
      );


    } catch (error) {

      console.error(
        "Error al obtener horarios:",
        error
      );


      return res
        .status(500)
        .json({

          mensaje:
            "Error al obtener horarios."

        });

    }

  };


// ======================================================
// GET HORARIOS DE UN EMPLEADO
// ======================================================

exports.getHorariosUsuario =
  async (req, res) => {

    try {

      const {
        usuarioId
      } = req.params;


      const horarios =
        await horarioService
          .getHorariosUsuario(
            usuarioId
          );


      return res.json(
        horarios
      );


    } catch (error) {

      return res
        .status(
          error.statusCode || 500
        )
        .json({

          mensaje:
            error.message ||
            "Error al obtener horarios."

        });

    }

  };


// ======================================================
// GET MI HORARIO DE HOY
// ======================================================

exports.getMiHorarioHoy =
  async (req, res) => {

    try {

      const usuarioId =
        req.user?.id;


      const horario =
        await horarioService
          .getMiHorarioHoy(
            usuarioId
          );


      return res.json(
        horario
      );


    } catch (error) {

      return res
        .status(
          error.statusCode || 500
        )
        .json({

          mensaje:
            error.message ||
            "Error al obtener horario."

        });

    }

  };


// ======================================================
// POST CREAR
// ======================================================

exports.createHorario =
  async (req, res) => {

    try {

      const resultado =
        await horarioService
          .createHorario(
            req.body
          );


      return res
        .status(201)
        .json(
          resultado
        );


    } catch (error) {

      console.error(
        "Error al crear horario:",
        error
      );


      return res
        .status(
          error.statusCode || 500
        )
        .json({

          mensaje:
            error.message ||
            "Error al crear cronograma."

        });

    }

  };


// ======================================================
// PUT
// ======================================================

exports.updateHorario =
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const resultado =
        await horarioService
          .updateHorario(
            id,
            req.body
          );


      return res.json(
        resultado
      );


    } catch (error) {

      return res
        .status(
          error.statusCode || 500
        )
        .json({

          mensaje:
            error.message ||
            "Error al modificar horario."

        });

    }

  };


// ======================================================
// DELETE
// ======================================================

exports.deleteHorario =
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const resultado =
        await horarioService
          .deleteHorario(id);


      return res.json(
        resultado
      );


    } catch (error) {

      return res
        .status(
          error.statusCode || 500
        )
        .json({

          mensaje:
            error.message ||
            "Error al eliminar horario."

        });

    }

  };