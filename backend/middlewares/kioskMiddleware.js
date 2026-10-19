const jwt = require('jsonwebtoken');
const permisoModel = require('../models/permiso.model');

exports.verifyKioskToken = async (req, res, next) => {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) {
    return res.status(401).json({ mensaje: 'Token requerido.' });
  }

  try {
    const token = jwt.verify(match[1], process.env.JWT_SECRET);
    if (token.purpose !== 'kiosk_qr' || token.role !== 'kiosk' ||
        !Number.isInteger(token.id) || token.id <= 0) {
      return res.status(403).json({ mensaje: 'Token de tótem inválido.' });
    }

    // Desactivar o bloquear al administrador revoca también el acceso del tótem.
    const user = await permisoModel.verificarPermisosUsuario(
      token.id, ['GENERAR_QR']
    );
    if (!user?.estado || user.cuenta_bloqueada || !user.autorizado) {
      return res.status(403).json({ mensaje: 'Tótem sin autorización.' });
    }
    req.user = token;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Token de tótem vencido o inválido.' });
    }
    return next(error);
  }
};
