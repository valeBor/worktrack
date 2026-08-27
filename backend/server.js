/*
  Archivo principal del backend.

  Usamos CommonJS:
  - require para importar
  - module.exports para exportar
*/


// ======================================================
// VARIABLES DE ENTORNO
// ======================================================

// path permite construir correctamente la ubicación del .env.
const path = require('path');

// Cargamos el archivo backend/.env.
//
// Usamos __dirname para que funcione aunque ejecutemos
// el proyecto desde otra carpeta.
require('dotenv').config({
  path: path.join(__dirname, '.env')
});


// ======================================================
// IMPORTACIONES
// ======================================================

const express = require('express');
const cors = require('cors');

const qrRoutes = require('./routes/qr.router');
const asistenciaRoutes = require('./routes/asistencia.router');
const solicitudRoutes = require('./routes/solicitud.router');
const horarioRoutes = require('./routes/horario.router');
const authRoutes = require('./routes/auth.router');
const userRoutes = require('./routes/users.router');


// Inicializa la configuración de la base de datos.
require('./config/db');


// ======================================================
// CREAR APLICACIÓN EXPRESS
// ======================================================

const app = express();


// ======================================================
// MIDDLEWARES GENERALES
// ======================================================

app.use(cors());

app.use(express.json());


// ======================================================
// RUTAS
// ======================================================

app.use('/qr', qrRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/asistencias', asistenciaRoutes);

app.use('/api/horarios', horarioRoutes);

app.use('/api/solicitudes',solicitudRoutes);


// ======================================================
// RUTAS DE PRUEBA
// ======================================================

app.get('/prueba', (req, res) => {

  res.send('PRUEBA OK');

});


app.get('/', (req, res) => {

  res.send('API WORKTRACK FUNCIONANDO');

});


// ======================================================
// INICIAR SERVIDOR
// ======================================================

// Obtiene el puerto desde el .env.
//
// Si PORT no estuviera definido,
// utiliza 3000 como valor alternativo.
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `Servidor http://localhost:${PORT}`
  );

});