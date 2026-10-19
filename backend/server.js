const app =
  require('./app');

const pool =
  require('./config/db');

const {
  validateEnvironment
} = require('./config/env');


let server =
  null;

let shutdownStarted =
  false;


// ======================================================
// OBTENER PUERTO DEL SERVIDOR
// ======================================================

function getPort() {

  const port =
    Number(
      process.env.PORT || 3000
    );


  if (

    !Number.isInteger(port) ||

    port <= 0

  ) {

    throw new Error(

      'PORT debe ser un número entero positivo.'

    );

  }


  return port;

}


// ======================================================
// INICIAR SERVIDOR
// ======================================================

async function startServer() {

  // Primero valida la configuración.
  //
  // En desarrollo controla los formatos.
  //
  // En producción también comprueba que estén
  // todas las variables y que se use Vercel Blob.
  validateEnvironment();


  const port =
    getPort();


  // Verifica MariaDB mediante SELECT 1.
  //
  // No inserta ni modifica registros.
  await pool.verifyConnection();


  console.log(

    'Conexión con MariaDB verificada'

  );


  server = app.listen(

    port,

    () => {

      console.log(

        `Servidor http://localhost:${port}`

      );

    }

  );

}


// ======================================================
// CERRAR POOL Y FINALIZAR
// ======================================================

async function finishProcess(
  exitCode
) {

  try {

    await pool.end();


    console.log(

      'Pool MySQL cerrado'

    );

  } catch (error) {

    console.error(

      'Error al cerrar el pool MySQL:',

      error.message

    );


    exitCode =
      1;

  }


  process.exitCode =
    exitCode;

}


// ======================================================
// CIERRE ORDENADO DEL SERVIDOR
// ======================================================

function shutdown(
  signal
) {

  if (
    shutdownStarted
  ) {

    return;

  }


  shutdownStarted =
    true;


  console.log(

    `${signal} recibido. Cerrando servidor...`

  );


  const forceShutdown =
    setTimeout(

      () => {

        console.error(

          'El servidor no pudo cerrarse dentro del tiempo esperado.'

        );


        process.exit(1);

      },

      10000

    );


  forceShutdown.unref();


  if (!server) {

    clearTimeout(
      forceShutdown
    );


    void finishProcess(0);

    return;

  }


  server.close(

    error => {

      clearTimeout(
        forceShutdown
      );


      if (error) {

        console.error(

          'Error al cerrar el servidor:',

          error.message

        );

      }


      void finishProcess(

        error ? 1 : 0

      );

    }

  );

}


// ======================================================
// SEÑALES DEL SISTEMA
// ======================================================

process.on(

  'SIGTERM',

  () => {

    shutdown(
      'SIGTERM'
    );

  }

);


process.on(

  'SIGINT',

  () => {

    shutdown(
      'SIGINT'
    );

  }

);


// ======================================================
// EJECUTAR INICIO
// ======================================================

startServer()

  .catch(

    async error => {

      console.error(

        'No se pudo iniciar el servidor:',

        error.message

      );


      await finishProcess(1);

    }

  );