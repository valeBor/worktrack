const mysql = require('mysql2/promise');

// Pool crea un conjunto de conexiones reutilizables.
// Es mejor que createConnection para una API porque puede atender varias consultas.
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'worktrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Pool MySQL configurado');

module.exports = pool;