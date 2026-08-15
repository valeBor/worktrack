const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

// QR válido durante 60 segundos
const QR_DURACION_MS = 5 * 60 * 1000;

// token -> timestamp
const tokensValidos = new Map();

function limpiarTokensVencidos() {
  const ahora = Date.now();

  for (const [token, timestamp] of tokensValidos.entries()) {
    if (ahora - timestamp > QR_DURACION_MS) {
      tokensValidos.delete(token);
    }
  }
}

exports.generarQR = async () => {
  limpiarTokensVencidos();

  const token = uuidv4();
  const timestamp = Date.now();

  tokensValidos.set(token, timestamp);

  console.log("QR generado:", token);
  console.log("Tokens válidos:", tokensValidos.size);

  const datosQR = JSON.stringify({
    token,
    timestamp
  });

  return await QRCode.toBuffer(datosQR);
};

exports.validarQrDinamico = (token) => {
  if (!token) {
    return {
      valido: false,
      motivo: "TOKEN_FALTANTE"
    };
  }

  console.log("Token recibido:", token);
  console.log("¿Token existe?:", tokensValidos.has(token));

  const timestamp = tokensValidos.get(token);

  if (!timestamp) {
    return {
      valido: false,
      motivo: "TOKEN_INVALIDO"
    };
  }

  const ahora = Date.now();
  const tiempoTranscurrido = ahora - timestamp;

  console.log(
    "Edad QR:",
    Math.floor(tiempoTranscurrido / 1000),
    "segundos"
  );

  if (tiempoTranscurrido > QR_DURACION_MS) {
    tokensValidos.delete(token);

    return {
      valido: false,
      motivo: "TOKEN_VENCIDO"
    };
  }

  return {
    valido: true,
    timestamp,
    tiempoRestante:
      QR_DURACION_MS - tiempoTranscurrido
  };
};