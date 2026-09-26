const path = require('path');


require('dotenv').config({

  path:
    path.join(
      __dirname,
      '.env'
    )

});


const express =
  require('express');

const cors =
  require('cors');

const helmet =
  require('helmet');


const qrRoutes =
  require('./routes/qr.router');

const asistenciaRoutes =
  require('./routes/asistencia.router');

const solicitudRoutes =
  require('./routes/solicitud.router');

const horarioRoutes =
  require('./routes/horario.router');

const authRoutes =
  require('./routes/auth.router');

const userRoutes =
  require('./routes/users.router');

const reporteAsistenciaRoutes =
  require('./routes/reporte-asistencia.router');

const notificacionRoutes =
  require('./routes/notificacion.router');

const alertaRoutes =
  require('./routes/alerta.router');

const asistenciaManualRoutes =
  require('./routes/asistencia-manual.router');


const pool =
  require('./config/db');


const app =
  express();


app.disable(
  'x-powered-by'
);


// ======================================================
// ORÍGENES AUTORIZADOS
// ======================================================

const frontendOrigins = (

  process.env.CORS_ORIGINS ||

  process.env.FRONTEND_URL ||

  'http://localhost:4200'

)

  .split(',')

  .map(
    origin =>
      origin.trim()
  )

  .filter(Boolean);


// ======================================================
// PROXY
// ======================================================

const trustProxyHops =
  Number(
    process.env.TRUST_PROXY_HOPS || 0
  );


if (

  Number.isInteger(
    trustProxyHops
  ) &&

  trustProxyHops > 0

) {

  app.set(
    'trust proxy',
    trustProxyHops
  );

}


// ======================================================
// SEGURIDAD Y PARSEO
// ======================================================

app.use(
  helmet()
);


app.use(

  cors({

    origin(
      origin,
      callback
    ) {

      if (

        !origin ||

        frontendOrigins.includes(
          origin
        )

      ) {

        return callback(
          null,
          true
        );

      }


      return callback(
        null,
        false
      );

    }

  })

);


app.use(

  express.json({

    limit:
      '100kb'

  })

);


// ======================================================
// RUTAS
// ======================================================

app.use(
  '/qr',
  qrRoutes
);


app.use(
  '/api/auth',
  authRoutes
);


app.use(
  '/api/users',
  userRoutes
);


app.use(
  '/api/asistencias',
  asistenciaRoutes
);


app.use(
  '/api/horarios',
  horarioRoutes
);


app.use(
  '/api/solicitudes',
  solicitudRoutes
);


app.use(
  '/api/reportes-asistencia',
  reporteAsistenciaRoutes
);


app.use(
  '/api/notificaciones',
  notificacionRoutes
);


app.use(
  '/api/alertas',
  alertaRoutes
);


app.use(
  '/api/asistencias/manual',
  asistenciaManualRoutes
);


// ======================================================
// HEALTH CHECK
// ======================================================
//
// Railway podrá consultar este endpoint.
//
// Devuelve 200 cuando la API y MariaDB funcionan.
// Devuelve 503 si la base deja de responder.
// ======================================================

app.get(

  '/health',

  async (
    req,
    res
  ) => {

    try {

      await pool.query(
        'SELECT 1'
      );


      return res
        .status(200)
        .json({

          status:
            'ok',

          database:
            'connected'

        });

    } catch (error) {

      console.error(
        'Error en health check:',
        error.message
      );


      return res
        .status(503)
        .json({

          status:
            'error',

          database:
            'unavailable'

        });

    }

  }

);


// ======================================================
// RUTA DE PRUEBA
// ======================================================

app.get(

  '/prueba',

  (
    req,
    res
  ) => {

    res.send(
      'PRUEBA OK'
    );

  }

);


// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get(

  '/',

  (
    req,
    res
  ) => {

    res.send(
      'API WORKTRACK FUNCIONANDO'
    );

  }

);


module.exports =
  app;