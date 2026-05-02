const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT u.*, r.nombre AS role
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.email = ?
  `;

  db.query(query, [email], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no existe' });
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    res.json({
      message: 'Login OK',
      email: user.email,
      role: user.role
    });

  });
});

module.exports = router;