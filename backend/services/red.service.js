const redModel = require("../models/red.model");

const {
  normalizarIp,
  ipPerteneceAlRango
} = require("../utils/ip.util");


/**
 * Busca una red autorizada activa
 * del tipo solicitado y verifica
 * que la IP pertenezca al rango.
 *
 * tipoRed:
 * LOCAL
 * VPN
 */
exports.buscarRedAutorizada = async (
  tipoRed,
  ipDetectada,
  connection
) => {

  const ip = normalizarIp(ipDetectada);

  const redes = await redModel.buscarRedesPorTipo(
    connection,
    tipoRed
  );

  for (const red of redes) {

    if (
      ipPerteneceAlRango(
        ip,
        red.ip_rango
      )
    ) {

      return red;

    }

  }

  return null;
};