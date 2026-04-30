const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

// 👇 Conexión a Mongo y luego arranca el server
mongoose.connect('mongodb://127.0.0.1:27017/worktrack')
  .then(() => {
    console.log('Mongo conectado');

    // rutas
    app.use('/api/auth', authRoutes);

    app.get('/', (req, res) => {
      res.send('API WORKTRACK FUNCIONANDO');
    });

    // server
    app.listen(3000, () => {
      console.log('Servidor en http://localhost:3000');
    });

  })
  .catch((err) => {
    console.error('Error conectando a Mongo:', err);
  });