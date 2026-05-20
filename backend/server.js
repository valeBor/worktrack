const express = require('express');
const cors = require('cors');

require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API WORKTRACK FUNCIONANDO');
});

app.listen(3000, () => {
  console.log('Servidor http://localhost:3000');
});