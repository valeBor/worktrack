const mysql = require('mysql2/promise');


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

  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,

  port: Number(process.env.DB_PORT) || 3306,


  connectionLimit:
    Number(process.env.DB_CONNECTION_LIMIT) || 10,

  queueLimit: 0

});


console.log('Pool MySQL configurado');


module.exports = pool;