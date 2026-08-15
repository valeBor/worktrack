/*archivo como index.js...usamos common js 
no module por eso usamos require, si usamos modele usariamos import y exports*/
const express = require('express');
const cors = require('cors');
const qrRoutes = require("./routes/qr.router");
const asistenciaRoutes = require("./routes/asistencia.router");
const horarioRoutes =
  require("./routes/horario.router");

require('./config/db');

const authRoutes = require('./routes/auth.router');
const userRoutes = require('./routes/users.router');

const app = express();

app.use(cors());
app.use(express.json());
app.use("/qr", qrRoutes);

app.get("/prueba", (req, res) => {
  res.send("PRUEBA OK");
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use("/api/asistencias", asistenciaRoutes);

app.use("/api/horarios", horarioRoutes);

app.get('/', (req, res) => {
  res.send('API WORKTRACK FUNCIONANDO');
});

app.listen(3000, () => {
  console.log('Servidor http://localhost:3000');
});