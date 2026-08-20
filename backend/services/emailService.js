const nodemailer = require('nodemailer');


// ======================================================
// CREAR TRANSPORTADOR DE CORREO
// ======================================================
//
// No creamos el transporter al iniciar el servidor.
//
// Lo creamos cuando realmente necesitamos enviar
// un correo. De esa manera el backend puede arrancar
// aunque todavía no tengamos configurado Gmail.
// ======================================================

function crearTransporter() {

  const emailUser =
    process.env.EMAIL_USER;

  const emailPass =
    process.env.EMAIL_PASS;


  if (!emailUser || !emailPass) {

    throw new Error(
      'Falta configurar EMAIL_USER o EMAIL_PASS en el archivo .env'
    );

  }


  return nodemailer.createTransport({

    service: 'gmail',

    auth: {

      user: emailUser,

      // Esta será la contraseña de aplicación
      // generada por Google.
      pass: emailPass

    }

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

  const transporter =
    crearTransporter();


  const nombreRemitente =
    process.env.EMAIL_FROM_NAME ||
    'Soporte técnico WorkTrack';


  const asunto =
    'Recuperar contraseña - WorkTrack';


  // Versión de texto simple.
  //
  // Se utiliza si el cliente de correo
  // no puede mostrar HTML.
  const texto = `
Hola ${nombreUsuario}:

Recibimos una solicitud para restablecer tu contraseña de WorkTrack.

Abrí el siguiente enlace:

${enlaceRecuperacion}

El enlace es válido durante 15 minutos.

Si no realizaste esta solicitud, podés ignorar este mensaje.

Soporte técnico WorkTrack
  `;


  // Versión visual del correo.
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
        Hola <strong>${nombreUsuario}</strong>:
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
          href="${enlaceRecuperacion}"
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


  const resultado =
    await transporter.sendMail({

      from:
        `"${nombreRemitente}" <${process.env.EMAIL_USER}>`,

      to: destinatario,

      subject: asunto,

      text: texto,

      html: html

    });


  return resultado;

};


// ======================================================
// VERIFICAR CONFIGURACIÓN DE GMAIL
// ======================================================
//
// Esta función permitirá probar más adelante
// la conexión con Gmail sin enviar un mensaje.
// ======================================================

exports.verificarConexionCorreo = async () => {

  const transporter =
    crearTransporter();


  await transporter.verify();


  return true;

};