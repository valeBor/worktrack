const {
  after,
  afterEach,
  mock,
  test
} = require('node:test');

const assert =
  require('node:assert/strict');

const request =
  require('supertest');


process.env.FRONTEND_URL =
  'http://localhost:4200';

process.env.CORS_ORIGINS =
  'http://localhost:4200';

process.env.TRUST_PROXY_HOPS =
  '0';


const app =
  require('../app');

const pool =
  require('../config/db');


// ======================================================
// LIMPIEZA DE MOCKS
// ======================================================

afterEach(
  () => {

    mock.restoreAll();

  }
);


// ======================================================
// CERRAR POOL AL FINALIZAR
// ======================================================

after(
  async () => {

    await pool.end();

  }
);


// ======================================================
// ESTADO GENERAL DE LA API
// ======================================================

test(

  'GET / informa que la API funciona',

  async () => {

    const response =
      await request(app)
        .get('/')
        .expect(200);


    assert.equal(

      response.text,

      'API WORKTRACK FUNCIONANDO'

    );

  }

);


// ======================================================
// HEALTH CHECK
// ======================================================

test(

  'Health check informa API y base disponibles',

  async () => {

    mock.method(

      pool,

      'query',

      async () => [

        [
          {
            result: 1
          }
        ],

        []

      ]

    );


    const response =
      await request(app)
        .get('/health')
        .expect(200);


    assert.deepEqual(

      response.body,

      {

        status:
          'ok',

        database:
          'connected'

      }

    );

  }

);


test(

  'Health check devuelve 503 si la base no responde',

  async () => {

    mock.method(

      pool,

      'query',

      async () => {

        throw new Error(
          'Base no disponible'
        );

      }

    );


    mock.method(

      console,

      'error',

      () => {}

    );


    const response =
      await request(app)
        .get('/health')
        .expect(503);


    assert.deepEqual(

      response.body,

      {

        status:
          'error',

        database:
          'unavailable'

      }

    );

  }

);


// ======================================================
// CORS
// ======================================================

test(

  'CORS permite el origen configurado',

  async () => {

    const response =
      await request(app)

        .get('/prueba')

        .set(

          'Origin',

          'http://localhost:4200'

        )

        .expect(200);


    assert.equal(

      response.headers[
        'access-control-allow-origin'
      ],

      'http://localhost:4200'

    );


    assert.equal(

      response.text,

      'PRUEBA OK'

    );

  }

);


test(

  'CORS no autoriza un origen no configurado',

  async () => {

    const response =
      await request(app)

        .get('/prueba')

        .set(

          'Origin',

          'https://sitio-no-autorizado.test'

        )

        .expect(200);


    assert.equal(

      response.headers[
        'access-control-allow-origin'
      ],

      undefined

    );

  }

);


// ======================================================
// HELMET
// ======================================================

test(

  'Helmet agrega encabezados de seguridad',

  async () => {

    const response =
      await request(app)
        .get('/prueba')
        .expect(200);


    assert.equal(

      response.headers[
        'x-content-type-options'
      ],

      'nosniff'

    );


    assert.equal(

      response.headers[
        'x-frame-options'
      ],

      'SAMEORIGIN'

    );


    assert.equal(

      response.headers[
        'x-powered-by'
      ],

      undefined

    );

  }

);


// ======================================================
// VALIDACIÓN DEL LOGIN
// ======================================================

test(

  'Login rechaza datos obligatorios incompletos',

  async () => {

    const response =
      await request(app)

        .post(
          '/api/auth/login'
        )

        .send({

          email:
            'admin@worktrack.com',

          password:
            'Password123'

        })

        .expect(400);


    assert.equal(

      response.body.message,

      'Los datos enviados no son válidos'

    );

  }

);


// ======================================================
// AUTENTICACIÓN JWT
// ======================================================

test(

  'Ruta protegida rechaza una solicitud sin token',

  async () => {

    const response =
      await request(app)

        .get(
          '/api/users'
        )

        .expect(401);


    assert.equal(

      response.body.message,

      'Token requerido'

    );

  }

);


test(

  'Ruta protegida rechaza un encabezado con formato inválido',

  async () => {

    const response =
      await request(app)

        .get(
          '/api/users'
        )

        .set(

          'Authorization',

          'Token-invalido'

        )

        .expect(401);


    assert.equal(

      response.body.message,

      'Formato de token inválido'

    );

  }

);


test(

  'Ruta protegida rechaza un JWT inválido',

  async () => {

    const response =
      await request(app)

        .get(
          '/api/users'
        )

        .set(

          'Authorization',

          'Bearer token-invalido'

        )

        .expect(401);


    assert.equal(

      response.body.message,

      'Token inválido o vencido'

    );

  }

);


// ======================================================
// RESTABLECIMIENTO DE CONTRASEÑA
// ======================================================

test(

  'Restablecimiento rechaza contraseñas diferentes',

  async () => {

    const response =
      await request(app)

        .post(
          '/api/auth/reset-password'
        )

        .send({

          token:
            'token-de-prueba',

          newPassword:
            'Password123',

          confirmPassword:
            'Password456'

        })

        .expect(400);


    assert.equal(

      response.body.message,

      'Las contraseñas no coinciden'

    );

  }

);


test(

  'Restablecimiento rechaza una contraseña insegura',

  async () => {

    const response =
      await request(app)

        .post(
          '/api/auth/reset-password'
        )

        .send({

          token:
            'token-de-prueba',

          newPassword:
            'abcdefgh',

          confirmPassword:
            'abcdefgh'

        })

        .expect(400);


    assert.equal(

      response.body.message,

      'La contraseña debe incluir mayúscula, minúscula y número'

    );

  }

);