const db = require('../config/db');
const bcrypt = require('bcrypt');
const authService = require('../services/authService');

async function verificarTurnstile(token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: '0x4AAAAAADT44yX-FxmBYCAvZjzap1xFZxM',
      response: token
    })
  });

  const data = await response.json();
  return data.success;
}

exports.login = async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body;

    const query = `
      SELECT u.*, r.nombre AS role
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
    `;

    const [results] = await db.query(query, [email]);

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Usuario no existe'
      });
    }

    const user = results[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Credenciales invalidas'
      });
    }

    // Acá sí se genera el JWT.
    // No llamamos a jwt.sign directamente porque eso ya está dentro de authService.
    const token = authService.generateToken(user);

    res.json({
      message: 'Login OK',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);

    res.status(500).json({
      message: 'Error servidor'
    });
  }
};