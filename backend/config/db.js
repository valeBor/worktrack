const mysql = require('mysql2/promise');


// ======================================================
// VALOR NUMÉRICO POSITIVO
// ======================================================

function positiveInteger(
  value,
  fallback
) {

  const number =
    Number(value);


  if (
    Number.isInteger(number) &&
    number > 0
  ) {

    return number;

  }


  return fallback;

}


// ======================================================
// POOL DE CONEXIONES MYSQL
// ======================================================
//
// El pool mantiene varias conexiones disponibles.
//
// Es mejor que createConnection para una API,
// porque permite atender varias solicitudes
// sin abrir una conexión nueva cada vez.
// ======================================================

const pool = mysql.createPool({

  host:
    process.env.DB_HOST,

  port:
    positiveInteger(
      process.env.DB_PORT,
      3306
    ),

  user:
    process.env.DB_USER,

  password:
    process.env.DB_PASSWORD,

  database:
    process.env.DB_NAME,

  waitForConnections:
    true,

  connectionLimit:
    positiveInteger(
      process.env.DB_CONNECTION_LIMIT,
      10
    ),

  connectTimeout:
    positiveInteger(
      process.env.DB_CONNECT_TIMEOUT_MS,
      10000
    ),

  enableKeepAlive:
    true,

  keepAliveInitialDelay:
    0,

  queueLimit:
    0

});


console.log(
  'Pool MySQL configurado'
);


// ======================================================
// VERIFICAR CONEXIÓN CON LA BASE
// ======================================================
//
// Realiza una consulta mínima y no modifica datos.
//
// Se utilizará al iniciar el servidor para evitar que
// la API quede publicada sin conexión con MariaDB.
// ======================================================

pool.verifyConnection =
  async () => {

    const connection =
      await pool.getConnection();


    try {

      await connection.query(
        'SELECT 1'
      );

    } finally {

      connection.release();

    }

  };


module.exports = pool;