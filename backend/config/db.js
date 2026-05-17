const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'worktrack'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conexión MySQL:', err);
  } else {
    console.log('MySQL conectado');
  }
});

module.exports = connection;