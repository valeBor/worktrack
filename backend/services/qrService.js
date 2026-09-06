const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const TIPO_TOKEN_QR = 'QR_ASISTENCIA';

const duracionConfigurada =
  Number(
    process.env.QR_DURACION_SEGUNDOS ||
    60
  );

const QR_DURACION_SEGUNDOS =
  Number.isFinite(duracionConfigurada) &&
  duracionConfigurada >= 30 &&
  duracionConfigurada <= 600
    ? Math.floor(duracionConfigurada)
    : 60;

// ======================================================
// OBTENER CLAVE SECRETA
// ======================================================

function obtenerClaveSecreta() {
  const claveSecreta =
    process.env.QR_TOKEN_SECRET;

  if (!claveSecreta) {
    throw new Error(
      'Falta configurar QR_TOKEN_SECRET en el archivo .env.'
    );
  }

  return claveSecreta;
}

// ======================================================
// GENERAR QR FIRMADO
// ======================================================

exports.generarQR = async () => {
  const claveSecreta =
    obtenerClaveSecreta();

  const generadoEn = Date.now();

  /*
   * El contenido del token se mantiene reducido
   * para generar un QR menos denso y más fácil
   * de leer con cámaras de notebook y celular.
   */
  const token = jwt.sign(
    {
      tipo: TIPO_TOKEN_QR
    },
    claveSecreta,
    {
      algorithm: 'HS256',
      expiresIn: QR_DURACION_SEGUNDOS
    }
  );

  const tokenDecodificado =
    jwt.decode(token);

  const expiraEn =
    tokenDecodificado &&
    typeof tokenDecodificado !== 'string' &&
    tokenDecodificado.exp
      ? tokenDecodificado.exp * 1000
      : generadoEn +
        QR_DURACION_SEGUNDOS * 1000;

  /*
   * Se codifica solamente el token.
   * Ya no se vuelve a envolver dentro de un JSON.
   */
  const qrBuffer =
    await QRCode.toBuffer(
      token,
      {
        type: 'png',
        width: 420,
        margin: 4,
        errorCorrectionLevel: 'L'
      }
    );

  return {
    qrBuffer,
    generadoEn,
    expiraEn,
    duracionSegundos:
      QR_DURACION_SEGUNDOS
  };
};

// ======================================================
// VALIDAR QR FIRMADO
// ======================================================

exports.validarQrDinamico = token => {
  const tokenNormalizado =
    String(token || '').trim();

  if (!tokenNormalizado) {
    return {
      valido: false,
      motivo: 'TOKEN_FALTANTE'
    };
  }

  const claveSecreta =
    obtenerClaveSecreta();

  try {
    const datos = jwt.verify(
      tokenNormalizado,
      claveSecreta,
      {
        algorithms: ['HS256'],
        clockTolerance: 2
      }
    );

    if (
      typeof datos === 'string' ||
      datos.tipo !== TIPO_TOKEN_QR
    ) {
      return {
        valido: false,
        motivo: 'TOKEN_INVALIDO'
      };
    }

    const ahora = Date.now();

    const expiraEn =
      datos.exp
        ? datos.exp * 1000
        : ahora;

    if (expiraEn <= ahora) {
      return {
        valido: false,
        motivo: 'TOKEN_VENCIDO'
      };
    }

    return {
      valido: true,
      timestamp:
        Number(datos.iat || 0) * 1000,
      tiempoRestante:
        expiraEn - ahora
    };
  } catch (error) {
    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      return {
        valido: false,
        motivo: 'TOKEN_VENCIDO'
      };
    }

    return {
      valido: false,
      motivo: 'TOKEN_INVALIDO'
    };
  }
};