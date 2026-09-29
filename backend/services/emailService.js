const nodemailer = require('nodemailer');

const BREVO_API_URL =
  'https://api.brevo.com/v3/smtp/email';

const BREVO_ACCOUNT_URL =
  'https://api.brevo.com/v3/account';

const EMAIL_TIMEOUT_MS = 15000;


// ======================================================
// OBTENER CONFIGURACIÓN DE CORREO
// ======================================================

function obtenerConfiguracionCorreo() {
  const emailUser =
    process.env.EMAIL_USER?.trim();

  const emailPass =
    process.env.EMAIL_PASS?.trim();

  const brevoApiKey =
    process.env.BREVO_API_KEY?.trim();

  const nombreRemitente =
    process.env.EMAIL_FROM_NAME?.trim() ||
    'Soporte técnico WorkTrack';

  if (!emailUser) {
    throw new Error(
      'Falta configurar EMAIL_USER en las variables de entorno'
    );
  }

  return {
    emailUser,
    emailPass,
    brevoApiKey,
    nombreRemitente
  };
}


// ======================================================
// ESCAPAR TEXTO PARA HTML
// ======================================================

function escaparHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ======================================================
// CREAR TRANSPORTADOR LOCAL DE GMAIL
// ======================================================
//
// Se utiliza como alternativa para el desarrollo local
// cuando BREVO_API_KEY no está configurada.
//
// Railway no permite SMTP en los planes utilizados por
// WorkTrack, por eso producción utiliza la API de Brevo.
// ======================================================

function crearTransporterGmail(
  emailUser,
  emailPass
) {
  if (!emailPass) {
    throw new Error(
      'Falta configurar EMAIL_PASS para utilizar Gmail SMTP'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',

    auth: {
      user: emailUser,
      pass: emailPass
    },

    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS
  });
}


// ======================================================
// PROCESAR RESPUESTA DE BREVO
// ======================================================

async function procesarRespuestaBrevo(
  response,
  operacion
) {
  const contenido =
    await response.text();

  let datos = null;

  if (contenido) {
    try {
      datos = JSON.parse(contenido);
    } catch {
      datos = {
        message: contenido
      };
    }
  }

  if (!response.ok) {
    const detalle =
      datos?.message ||
      `HTTP ${response.status}`;

    throw new Error(
      `Brevo rechazó la operación "${operacion}": ${detalle}`
    );
  }

  return datos || {};
}


// ======================================================
// ENVIAR CORREO MEDIANTE LA API HTTPS DE BREVO
// ======================================================

async function enviarConBrevo({
  apiKey,
  emailRemitente,
  nombreRemitente,
  destinatario,
  nombreUsuario,
  asunto,
  texto,
  html
}) {
  const response =
    await fetch(
      BREVO_API_URL,
      {
        method: 'POST',

        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },

        body: JSON.stringify({
          sender: {
            name: nombreRemitente,
            email: emailRemitente
          },

          to: [
            {
              email: destinatario,
              name: nombreUsuario
            }
          ],

          subject: asunto,
          textContent: texto,
          htmlContent: html
        }),

        signal:
          AbortSignal.timeout(
            EMAIL_TIMEOUT_MS
          )
      }
    );

  return procesarRespuestaBrevo(
    response,
    'envío de correo'
  );
}


// ======================================================
// ENVIAR CORREO MEDIANTE GMAIL SMTP LOCAL
// ======================================================

async function enviarConGmail({
  emailUser,
  emailPass,
  nombreRemitente,
  destinatario,
  asunto,
  texto,
  html
}) {
  const transporter =
    crearTransporterGmail(
      emailUser,
      emailPass
    );

  return transporter.sendMail({
    from:
      `"${nombreRemitente}" <${emailUser}>`,

    to: destinatario,

    subject: asunto,

    text: texto,

    html: html
  });
}


// ======================================================
// ENVIAR EMAIL DE RECUPERACIÓN
// ======================================================

exports.enviarEmailRecuperacion = async (
  destinatario,
  nombreUsuario,
  enlaceRecuperacion
) => {
  const {
    emailUser,
    emailPass,
    brevoApiKey,
    nombreRemitente
  } = obtenerConfiguracionCorreo();

  const nombreSeguro =
    escaparHtml(nombreUsuario);

  const enlaceSeguro =
    escaparHtml(enlaceRecuperacion);

  const asunto =
    'Recuperar contraseña - WorkTrack';

  const texto = `
Hola ${nombreUsuario}:

Recibimos una solicitud para restablecer tu contraseña de WorkTrack.

Abrí el siguiente enlace:

${enlaceRecuperacion}

El enlace es válido durante 15 minutos.

Si no realizaste esta solicitud, podés ignorar este mensaje.

Soporte técnico WorkTrack
  `.trim();

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 520px;
        margin: 0 auto;
        padding: 24px;
        color: #1f2937;
      "
    >
      <h2
        style="
          color: #198754;
          margin-bottom: 20px;
        "
      >
        Recuperar contraseña
      </h2>

      <p>
        Hola <strong>${nombreSeguro}</strong>:
      </p>

      <p>
        Recibimos una solicitud para restablecer
        tu contraseña de WorkTrack.
      </p>

      <p>
        Presioná el siguiente botón para crear
        una contraseña nueva:
      </p>

      <p
        style="
          margin: 28px 0;
          text-align: center;
        "
      >
        <a
          href="${enlaceSeguro}"
          style="
            display: inline-block;
            padding: 12px 22px;
            background-color: #198754;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          "
        >
          Restablecer contraseña
        </a>
      </p>

      <p>
        Este enlace es válido durante
        <strong>15 minutos</strong>.
      </p>

      <p>
        Si no realizaste esta solicitud,
        podés ignorar este mensaje.
        Tu contraseña no será modificada.
      </p>

      <hr
        style="
          margin: 24px 0;
          border: none;
          border-top: 1px solid #dddddd;
        "
      >

      <p
        style="
          font-size: 13px;
          color: #6b7280;
        "
      >
        Soporte técnico WorkTrack
      </p>
    </div>
  `;

  if (brevoApiKey) {
    return enviarConBrevo({
      apiKey: brevoApiKey,
      emailRemitente: emailUser,
      nombreRemitente,
      destinatario,
      nombreUsuario,
      asunto,
      texto,
      html
    });
  }

  return enviarConGmail({
    emailUser,
    emailPass,
    nombreRemitente,
    destinatario,
    asunto,
    texto,
    html
  });
};


// ======================================================
// VERIFICAR CONFIGURACIÓN DE CORREO
// ======================================================

exports.verificarConexionCorreo = async () => {
  const {
    emailUser,
    emailPass,
    brevoApiKey
  } = obtenerConfiguracionCorreo();

  if (brevoApiKey) {
    const response =
      await fetch(
        BREVO_ACCOUNT_URL,
        {
          method: 'GET',

          headers: {
            accept: 'application/json',
            'api-key': brevoApiKey
          },

          signal:
            AbortSignal.timeout(
              EMAIL_TIMEOUT_MS
            )
        }
      );

    await procesarRespuestaBrevo(
      response,
      'verificación de la cuenta'
    );

    return true;
  }

  const transporter =
    crearTransporterGmail(
      emailUser,
      emailPass
    );

  await transporter.verify();

  return true;
};