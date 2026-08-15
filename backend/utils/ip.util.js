const ipaddr = require("ipaddr.js");


/**
 * Normaliza la IP recibida por Node.
 */
function normalizarIp(ip) {

  if (!ip) {
    return "";
  }

  let ipNormalizada = String(ip).trim();


  // Si llega una lista de IPs
  if (ipNormalizada.includes(",")) {

    ipNormalizada =
      ipNormalizada
        .split(",")[0]
        .trim();

  }


  // localhost IPv6
  if (ipNormalizada === "::1") {

    return "127.0.0.1";

  }


  // IPv4 representada como IPv6
  if (
    ipNormalizada.startsWith(
      "::ffff:"
    )
  ) {

    ipNormalizada =
      ipNormalizada.substring(7);

  }


  return ipNormalizada;
}


/**
 * Comprueba si una IP pertenece
 * a un rango CIDR.
 *
 * Ejemplos:
 *
 * 127.0.0.1
 * dentro de
 * 127.0.0.1/32
 *
 * 192.168.1.30
 * dentro de
 * 192.168.1.0/24
 */
function ipPerteneceAlRango(
  ip,
  rango
) {

  try {

    const ipNormalizada =
      normalizarIp(ip);

    if (
      !ipNormalizada ||
      !rango
    ) {

      return false;

    }


    let rangoNormalizado =
      String(rango).trim();


    /*
     * Si en la base guardamos:
     *
     * 127.0.0.1
     *
     * en vez de:
     *
     * 127.0.0.1/32
     *
     * agregamos automáticamente
     * el prefijo.
     */
    if (
      !rangoNormalizado.includes("/")
    ) {

      const direccion =
        ipaddr.parse(
          rangoNormalizado
        );

      if (
        direccion.kind() === "ipv4"
      ) {

        rangoNormalizado =
          `${rangoNormalizado}/32`;

      } else {

        rangoNormalizado =
          `${rangoNormalizado}/128`;

      }

    }


    let direccionIp =
      ipaddr.parse(
        ipNormalizada
      );


    const [
      direccionRed,
      prefijo
    ] =
      ipaddr.parseCIDR(
        rangoNormalizado
      );


    /*
     * Si Node entregó IPv4
     * dentro de IPv6.
     */
    if (
      direccionIp.kind() === "ipv6" &&
      direccionIp.isIPv4MappedAddress()
    ) {

      direccionIp =
        direccionIp.toIPv4Address();

    }


    if (
      direccionIp.kind()
      !==
      direccionRed.kind()
    ) {

      return false;

    }


    return direccionIp.match(
      direccionRed,
      prefijo
    );

  } catch (error) {

    console.error(
      "Error al validar rango IP:",
      error.message
    );

    return false;

  }

}


module.exports = {
  normalizarIp,
  ipPerteneceAlRango
};