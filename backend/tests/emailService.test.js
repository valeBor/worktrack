const {
  afterEach,
  test
} = require('node:test');

const assert =
  require('node:assert/strict');

const nodemailer =
  require('nodemailer');

const emailService =
  require('../services/emailService');


// ======================================================
// CONSERVAR CONFIGURACIÓN ORIGINAL
// ======================================================

const originalEnvironment = {
  ...process.env
};

const originalFetch =
  global.fetch;

const originalCreateTransport =
  nodemailer.createTransport;


// ======================================================
// RESTAURAR DESPUÉS DE CADA PRUEBA
// ======================================================

afterEach(
  () => {

    Object
      .keys(process.env)
      .forEach(
        key => {

          delete process.env[key];

        }
      );

    Object.assign(
      process.env,
      originalEnvironment
    );

    global.fetch =
      originalFetch;

    nodemailer.createTransport =
      originalCreateTransport;

  }
);


// ======================================================
// CONFIGURAR BREVO PARA LAS PRUEBAS
// ======================================================

function configurarBrevo() {

  process.env.EMAIL_USER =
    'soporte@worktrack.test';

  process.env.EMAIL_FROM_NAME =
    'Soporte WorkTrack';

  process.env.BREVO_API_KEY =
    'brevo-api-key-secreta-de-prueba';

  delete process.env.EMAIL_PASS;

}


// ======================================================
// ENVÍO MEDIANTE BREVO
// ======================================================

test(

  'Envía la recuperación mediante la API de Brevo',

  async () => {

    configurarBrevo();

    let solicitudCapturada;

    global.fetch =
      async (
        url,
        options
      ) => {

        solicitudCapturada = {
          url,
          options
        };

        return {
          ok: true,
          status: 201,

          text: async () =>
            JSON.stringify({
              messageId:
                'mensaje-brevo-de-prueba'
            })
        };

      };

    const resultado =
      await emailService
        .enviarEmailRecuperacion(
          'empleado@worktrack.test',
          'Empleado WorkTrack',
          'https://worktrack.test/reset-password/token-de-prueba'
        );

    assert.equal(
      solicitudCapturada.url,
      'https://api.brevo.com/v3/smtp/email'
    );

    assert.equal(
      solicitudCapturada.options.method,
      'POST'
    );

    assert.equal(
      solicitudCapturada
        .options
        .headers['api-key'],
      'brevo-api-key-secreta-de-prueba'
    );

    const contenido =
      JSON.parse(
        solicitudCapturada.options.body
      );

    assert.deepEqual(
      contenido.sender,
      {
        name:
          'Soporte WorkTrack',

        email:
          'soporte@worktrack.test'
      }
    );

    assert.deepEqual(
      contenido.to,
      [
        {
          email:
            'empleado@worktrack.test',

          name:
            'Empleado WorkTrack'
        }
      ]
    );

    assert.match(
      contenido.subject,
      /Recuperar/
    );

    assert.match(
      contenido.htmlContent,
      /reset-password\/token-de-prueba/
    );

    assert.equal(
      resultado.messageId,
      'mensaje-brevo-de-prueba'
    );

  }

);


// ======================================================
// PROTECCIÓN DEL CONTENIDO HTML
// ======================================================

test(

  'Escapa datos dinámicos incluidos en el HTML',

  async () => {

    configurarBrevo();

    let contenidoEnviado;

    global.fetch =
      async (
        url,
        options
      ) => {

        contenidoEnviado =
          JSON.parse(options.body);

        return {
          ok: true,
          status: 201,

          text: async () =>
            JSON.stringify({
              messageId:
                'mensaje-html-de-prueba'
            })
        };

      };

    await emailService
      .enviarEmailRecuperacion(
        'empleado@worktrack.test',
        'Usuario <script>',
        'https://worktrack.test/reset?token=<token>'
      );

    assert.match(
      contenidoEnviado.htmlContent,
      /Usuario &lt;script&gt;/
    );

    assert.match(
      contenidoEnviado.htmlContent,
      /token=&lt;token&gt;/
    );

    assert.doesNotMatch(
      contenidoEnviado.htmlContent,
      /Usuario <script>/
    );

  }

);


// ======================================================
// ERROR DEVUELTO POR BREVO
// ======================================================

test(

  'Informa un error controlado si Brevo rechaza el envío',

  async () => {

    configurarBrevo();

    global.fetch =
      async () => ({
        ok: false,
        status: 401,

        text: async () =>
          JSON.stringify({
            message:
              'Clave no autorizada'
          })
      });

    await assert.rejects(

      () =>
        emailService
          .enviarEmailRecuperacion(
            'empleado@worktrack.test',
            'Empleado WorkTrack',
            'https://worktrack.test/reset/token'
          ),

      error => {

        assert.match(
          error.message,
          /Brevo rechazó/
        );

        assert.match(
          error.message,
          /Clave no autorizada/
        );

        assert.doesNotMatch(
          error.message,
          /brevo-api-key-secreta-de-prueba/
        );

        return true;

      }

    );

  }

);


// ======================================================
// VERIFICAR CUENTA DE BREVO
// ======================================================

test(

  'Verifica la conexión con la cuenta de Brevo',

  async () => {

    configurarBrevo();

    let solicitudCapturada;

    global.fetch =
      async (
        url,
        options
      ) => {

        solicitudCapturada = {
          url,
          options
        };

        return {
          ok: true,
          status: 200,

          text: async () =>
            JSON.stringify({
              email:
                'soporte@worktrack.test'
            })
        };

      };

    const resultado =
      await emailService
        .verificarConexionCorreo();

    assert.equal(
      resultado,
      true
    );

    assert.equal(
      solicitudCapturada.url,
      'https://api.brevo.com/v3/account'
    );

    assert.equal(
      solicitudCapturada.options.method,
      'GET'
    );

    assert.equal(
      solicitudCapturada
        .options
        .headers['api-key'],
      'brevo-api-key-secreta-de-prueba'
    );

  }

);


// ======================================================
// ALTERNATIVA LOCAL CON GMAIL
// ======================================================

test(

  'Utiliza Gmail SMTP como alternativa local sin Brevo',

  async () => {

    process.env.EMAIL_USER =
      'soporte@worktrack.test';

    process.env.EMAIL_PASS =
      'password-de-aplicacion-de-prueba';

    process.env.EMAIL_FROM_NAME =
      'Soporte WorkTrack';

    delete process.env.BREVO_API_KEY;

    let configuracionTransporter;
    let correoCapturado;

    nodemailer.createTransport =
      configuracion => {

        configuracionTransporter =
          configuracion;

        return {
          sendMail:
            async correo => {

              correoCapturado =
                correo;

              return {
                messageId:
                  'mensaje-gmail-de-prueba'
              };

            }
        };

      };

    global.fetch =
      async () => {

        throw new Error(
          'No debería utilizar Brevo'
        );

      };

    const resultado =
      await emailService
        .enviarEmailRecuperacion(
          'empleado@worktrack.test',
          'Empleado WorkTrack',
          'http://localhost:4200/reset/token'
        );

    assert.equal(
      configuracionTransporter.service,
      'gmail'
    );

    assert.deepEqual(
      configuracionTransporter.auth,
      {
        user:
          'soporte@worktrack.test',

        pass:
          'password-de-aplicacion-de-prueba'
      }
    );

    assert.equal(
      correoCapturado.to,
      'empleado@worktrack.test'
    );

    assert.equal(
      resultado.messageId,
      'mensaje-gmail-de-prueba'
    );

  }

);