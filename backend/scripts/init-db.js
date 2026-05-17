const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  multipleStatements: true
});

const schemaPath = path.join(__dirname, '../database/schema.sql');
const seedPath = path.join(__dirname, '../database/seed.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');
const seed = fs.readFileSync(seedPath, 'utf8');

connection.connect(err => {
  if (err) {
    console.error('Error conexión:', err);
    return;
  }

  console.log('Conectado a MySQL');

  connection.query(schema, (err) => {
    if (err) {
      console.error('Error schema:', err);
      return;
    }

    console.log('Base y tablas creadas');

    connection.query(seed, (err) => {
      if (err) {
        console.error('Error seed:', err);
        return;
      }

      console.log('Datos iniciales cargados');
      connection.end();
    });
  });
});