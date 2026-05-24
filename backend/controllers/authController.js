const db = require('../config/db');
const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {

  const { email, password } = req.body;

  const query = `
    SELECT u.*, r.nombre AS role
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.email = ?
  `;

  db.query(query, [email], async (err, results) => {

    if (err) {

      console.error(err);

      return res.status(500).json({
        message: 'Error servidor'
      });

    }

    if (results.length === 0) {

      return res.status(404).json({
        message: 'Usuario no existe'
      });

    }

    const user = results[0];

    // VALIDAR PASSWORD ENCRIPTADA
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {

      return res.status(401).json({
        message: 'Credenciales invalidas' /**para no dar informacion exacta si es el password o el mail el incorrecto */
      });

    }

    const token = authService.generateToken(user);

    res.json({

      message: 'Login OK',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  });

};