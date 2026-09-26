const {
  afterEach,
  test
} = require('node:test');

const assert =
  require('node:assert/strict');

const {
  validateEnvironment
} = require('../config/env');


// ======================================================
// CONSERVAR VARIABLES ORIGINALES
// ======================================================

const originalEnvironment = {

  ...process.env

};


// ======================================================
// RESTAURAR VARIABLES DESPUÉS DE CADA PRUEBA
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

  }
);


// ======================================================
// CONFIGURACIÓN VÁLIDA DE PRODUCCIÓN
// ======================================================

function configureProductionEnvironment(

  overrides = {}

) {

  Object.assign(

    process.env,

    {

      NODE_ENV:
        'production',

      PORT:
        '3000',

      FRONTEND_URL:
        'https://worktrack.vercel.app',

      CORS_ORIGINS:
        'https://worktrack.vercel.app',

      TRUST_PROXY_HOPS:
        '1',

      APP_TIMEZONE:
        'America/Argentina/Buenos_Aires',

      DB_HOST:
        'mariadb.railway.internal',

      DB_PORT:
        '3306',

      DB_USER:
        'worktrack',

      DB_PASSWORD:
        'password-de-prueba',

      DB_NAME:
        'worktrack',

      DB_CONNECTION_LIMIT:
        '10',

      DB_CONNECT_TIMEOUT_MS:
        '10000',

      JWT_SECRET:
        'jwt-secret-de-prueba',

      RESET_TOKEN_SECRET:
        'reset-secret-de-prueba',

      TURNSTILE_SECRET_KEY:
        'turnstile-secret-de-prueba',

      EMAIL_USER:
        'soporte@worktrack.test',

      EMAIL_PASS:
        'email-password-de-prueba',

      QR_TOKEN_SECRET:
        'qr-secret-de-prueba',

      QR_DURACION_SEGUNDOS:
        '60',

      FILE_STORAGE_PROVIDER:
        'VERCEL_BLOB',

      BLOB_READ_WRITE_TOKEN:
        'blob-token-de-prueba',

      ...overrides

    }

  );

}


// ======================================================
// DESARROLLO
// ======================================================

test(

  'Acepta variables válidas de desarrollo',

  () => {

    process.env.NODE_ENV =
      'development';

    process.env.DB_PORT =
      '3306';

    process.env.TRUST_PROXY_HOPS =
      '0';


    assert.doesNotThrow(

      () => {

        validateEnvironment();

      }

    );

  }

);


// ======================================================
// NODE_ENV
// ======================================================

test(

  'Rechaza un NODE_ENV desconocido',

  () => {

    process.env.NODE_ENV =
      'incorrecto';


    assert.throws(

      () => {

        validateEnvironment();

      },

      /NODE_ENV debe ser/

    );

  }

);


// ======================================================
// VALORES NUMÉRICOS
// ======================================================

test(

  'Rechaza un puerto de base inválido',

  () => {

    process.env.NODE_ENV =
      'development';

    process.env.DB_PORT =
      'puerto-invalido';


    assert.throws(

      () => {

        validateEnvironment();

      },

      /DB_PORT debe ser/

    );

  }

);


// ======================================================
// VARIABLES OBLIGATORIAS
// ======================================================

test(

  'Producción rechaza variables obligatorias faltantes',

  () => {

    configureProductionEnvironment();


    delete process.env.JWT_SECRET;


    assert.throws(

      () => {

        validateEnvironment();

      },

      /JWT_SECRET/

    );

  }

);


// ======================================================
// ALMACENAMIENTO LOCAL
// ======================================================

test(

  'Producción rechaza almacenamiento local',

  () => {

    configureProductionEnvironment({

      FILE_STORAGE_PROVIDER:
        'LOCAL'

    });


    assert.throws(

      () => {

        validateEnvironment();

      },

      /debe ser VERCEL_BLOB/

    );

  }

);


// ======================================================
// TOKEN DE VERCEL BLOB
// ======================================================

test(

  'Producción exige el token de Vercel Blob',

  () => {

    configureProductionEnvironment();


    delete process.env
      .BLOB_READ_WRITE_TOKEN;


    assert.throws(

      () => {

        validateEnvironment();

      },

      /BLOB_READ_WRITE_TOKEN/

    );

  }

);


// ======================================================
// PRODUCCIÓN VÁLIDA
// ======================================================

test(

  'Acepta una configuración completa de producción',

  () => {

    configureProductionEnvironment();


    assert.doesNotThrow(

      () => {

        validateEnvironment();

      }

    );

  }

);