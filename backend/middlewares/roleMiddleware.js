exports.verifyRole = (...roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {

      return res.status(403).json({
        message: 'Sin permisos'
      });

    }

    next();

  };

};

// ======================================================
// SOLO SUPERVISOR O ADMIN
// ======================================================

exports.soloSupervisorAdmin = (req, res, next) => {

  const role = req.user?.role;

  if (
    role !== 'supervisor' &&
    role !== 'admin'
  ) {

    return res.status(403).json({
      mensaje: 'No tiene permisos para gestionar cronogramas'
    });

  }

  next();
};