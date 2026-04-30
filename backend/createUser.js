const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/worktrack');
    console.log('Mongo conectado');

    const users = [
      { email: 'admin@test.com', role: 'admin' },
      { email: 'rrhh@test.com', role: 'rrhh' },
      { email: 'sup@test.com', role: 'supervisor' },
      { email: 'emp@test.com', role: 'empleado' }
    ];

    for (let u of users) {
      const hash = await bcrypt.hash('123456', 10);

      await User.create({
        email: u.email,
        password: hash,
        role: u.role
      });
    }

    console.log('Usuarios creados');
    mongoose.disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}

createUsers();