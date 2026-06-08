const asistenciaModel = require("../models/asistencia.model");

exports.registrarAsistencia = async ({ usuarioId, tipo, token }) => {

  if (!usuarioId) {
    throw new Error("Usuario no autenticado");
  }

  if (!token) {
    throw new Error("Token QR requerido");
  }
  //
  if (tipo !== "entrada" && tipo !== "salida") {
    throw new Error("Tipo de registro inválido");
  }

  const asistenciaHoy = await asistenciaModel.buscarAsistenciaHoy(usuarioId);

  if (tipo === "entrada") {

    if (asistenciaHoy && asistenciaHoy.hora_entrada) {
      throw new Error("Ya registraste la entrada de hoy");
    }

    await asistenciaModel.registrarEntrada(
      usuarioId,
      "presencial",
      null
    );

    return {
      mensaje: "Entrada registrada correctamente"
    };
  }
  ///sino registra la entrada no puede registrar la salida
  if (tipo === "salida") {

    if (!asistenciaHoy) {
      throw new Error("No existe una entrada registrada para hoy");
    }

    if (asistenciaHoy.hora_salida) {
      throw new Error("Ya registraste la salida de hoy");
    }

    await asistenciaModel.registrarSalida(asistenciaHoy.id);

    return {
      mensaje: "Salida registrada correctamente"
    };
  }
};