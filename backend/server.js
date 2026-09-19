const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const express = require('express');
const cors = require('cors');

const qrRoutes = require('./routes/qr.router');
const asistenciaRoutes = require('./routes/asistencia.router');
const solicitudRoutes = require('./routes/solicitud.router');
const horarioRoutes = require('./routes/horario.router');
const authRoutes = require('./routes/auth.router');
const userRoutes = require('./routes/users.router');
const reporteAsistenciaRoutes = require('./routes/reporte-asistencia.router');
const notificacionRoutes = require('./routes/notificacion.router');
const alertaRoutes = require('./routes/alerta.router');

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/qr', qrRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/reportes-asistencia', reporteAsistenciaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/alertas', alertaRoutes);

app.get('/prueba', (req, res) => {
  res.send('PRUEBA OK');
});

app.get('/', (req, res) => {
  res.send('API WORKTRACK FUNCIONANDO');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor http://localhost:${PORT}`);
});