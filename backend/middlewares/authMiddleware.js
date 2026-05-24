const jwt = require('jsonwebtoken');



exports.verifyToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({
      message: 'Token requerido'
    });

  }

  const token = authHeader.split(' ')[1];

  try {

    const decoded = jwt.verify(

      token,
      process.env.JWT_SECRET || 'worktrack_secret'
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Token inválido'
    });

  }

};