const db = require("../config/db");

const horarioModel =
  require("../models/horario.model");

const {
  obtenerFechaHoraActual
} = require("../utils/fecha.util");


// ======================================================
// CREAR ERROR
// ======================================================

function crearError(
  mensaje,
  statusCode = 400
) {

  const error = new Error(mensaje);

  error.statusCode = statusCode;

  return error;
}


// ======================================================
// DÍAS VÁLIDOS
// ======================================================

const DIAS_VALIDOS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo"
];


// ======================================================
// VALIDAR DATOS
// ======================================================

function validarHorario(datos) {

  if (!datos.usuario_id) {

    throw crearError(
      "Debe seleccionar un empleado.",
      400
    );

  }


  if (
    !Array.isArray(datos.dias_semana) ||
    datos.dias_semana.length === 0
  ) {

    throw crearError(
      "Debe seleccionar al menos un día.",
      400
    );

  }


  if (!datos.hora_entrada) {

    throw crearError(
      "Debe ingresar una hora de entrada.",
      400
    );

  }


  if (!datos.hora_salida) {

    throw crearError(
      "Debe ingresar una hora de salida.",
      400
    );

  }


  if (
    datos.hora_entrada >=
    datos.hora_salida
  ) {

    throw crearError(
      "La hora de salida debe ser posterior a la hora de entrada.",
      400
    );

  }


  const modalidad =
    String(
      datos.modalidad
    ).toUpperCase();


  if (
    modalidad !== "PRESENCIAL" &&
    modalidad !== "HOME"
  ) {

    throw crearError(
      "Modalidad inválida.",
      400
    );

  }


  for (
    const dia of datos.dias_semana
  ) {

    if (
      !DIAS_VALIDOS.includes(
        String(dia).toLowerCase()
      )
    ) {

      throw crearError(
        `Día inválido: ${dia}`,
        400
      );

    }

  }

}


// ======================================================
// OBTENER TODOS
// ======================================================

exports.getHorarios = async () => {

  return await horarioModel.getAll();

};


// ======================================================
// OBTENER POR USUARIO
// ======================================================

exports.getHorariosUsuario =
  async (usuarioId) => {

    return await horarioModel
      .getByUsuario(usuarioId);

  };


// ======================================================
// OBTENER MI HORARIO DE HOY
// ======================================================

exports.getMiHorarioHoy =
  async (usuarioId) => {

    const {
      diaSemana
    } = obtenerFechaHoraActual();


    const horario =
      await horarioModel
        .getByUsuarioAndDia(
          usuarioId,
          diaSemana
        );


    if (!horario) {

      throw crearError(
        "No tiene horario asignado para hoy.",
        404
      );

    }


    return horario;

  };


// ======================================================
// CREAR CRONOGRAMA
// ======================================================

exports.createHorario =
  async (datos) => {

    validarHorario(datos);


    const connection =
      await db.getConnection();


    try {

      await connection.beginTransaction();


      const usuarioId =
        Number(
          datos.usuario_id
        );


      const modalidad =
        String(
          datos.modalidad
        ).toUpperCase();


      const tolerancia =
        Number(
          datos.tolerancia_minutos || 0
        );


      const dias =
        datos.dias_semana.map(
          (dia) =>
            String(dia).toLowerCase()
        );


      const horariosCreados = [];


      // ==================================================
      // RECORRER LOS DÍAS SELECCIONADOS
      // ==================================================

      for (const dia of dias) {


        // -----------------------------------------------
        // Evitar que el mismo empleado tenga
        // dos horarios para el mismo día.
        // -----------------------------------------------

        const existente =
          await horarioModel
            .getByUsuarioAndDia(
              usuarioId,
              dia
            );


        if (existente) {

          throw crearError(
            `El empleado ya tiene un horario asignado para ${dia}.`,
            409
          );

        }


        const horario = {

          usuario_id:
            usuarioId,

          dia_semana:
            dia,

          hora_entrada:
            datos.hora_entrada,

          hora_salida:
            datos.hora_salida,

          tolerancia_minutos:
            tolerancia,

          modalidad:
            modalidad

        };


        const result =
          await horarioModel.create(
            connection,
            horario
          );


        horariosCreados.push({

          id:
            result.insertId,

          dia_semana:
            dia

        });

      }


      // ==================================================
      // TODO OK
      // ==================================================

      await connection.commit();


      return {

        mensaje:
          "Cronograma creado correctamente.",

        cantidad:
          horariosCreados.length,

        horarios:
          horariosCreados

      };


    } catch (error) {

      await connection.rollback();

      throw error;


    } finally {

      connection.release();

    }

  };


// ======================================================
// MODIFICAR
// ======================================================

exports.updateHorario =
  async (
    id,
    datos
  ) => {

    if (
      !datos.hora_entrada ||
      !datos.hora_salida
    ) {

      throw crearError(
        "Debe indicar entrada y salida.",
        400
      );

    }


    if (
      datos.hora_entrada >=
      datos.hora_salida
    ) {

      throw crearError(
        "La hora de salida debe ser posterior.",
        400
      );

    }


    const modalidad =
      String(
        datos.modalidad
      ).toUpperCase();


    if (
      modalidad !== "PRESENCIAL" &&
      modalidad !== "HOME"
    ) {

      throw crearError(
        "Modalidad inválida.",
        400
      );

    }


    const horario = {

      hora_entrada:
        datos.hora_entrada,

      hora_salida:
        datos.hora_salida,

      tolerancia_minutos:
        Number(
          datos.tolerancia_minutos || 0
        ),

      modalidad

    };


    const result =
      await horarioModel.update(
        id,
        horario
      );


    if (
      result.affectedRows === 0
    ) {

      throw crearError(
        "Horario no encontrado.",
        404
      );

    }


    return {

      mensaje:
        "Horario actualizado correctamente."

    };

  };


// ======================================================
// ELIMINAR
// ======================================================

exports.deleteHorario =
  async (id) => {

    const result =
      await horarioModel.remove(id);


    if (
      result.affectedRows === 0
    ) {

      throw crearError(
        "Horario no encontrado.",
        404
      );

    }


    return {

      mensaje:
        "Horario eliminado correctamente."

    };

  };