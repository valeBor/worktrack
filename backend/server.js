const express = require('express');
const cors = require('cors');

// 👇 IMPORTANTE: esto inicializa la conexión a MySQL
require('./db');

const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Rutas
app.use('/api/auth', authRoutes);

// 🔹 Ruta test
app.get('/', (req, res) => {
  res.send('API WORKTRACK FUNCIONANDO');
});

// 🔹 Levantar servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});