// ======================================================
// VERIFICAR UNO O MÁS ROLES
// ======================================================

exports.verifyRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();

    if (!role) {
      return res.status(401).json({
        mensaje: 'Usuario no autenticado.'
      });
    }

    if (!rolesPermitidos.includes(role)) {
      return res.status(403).json({
        mensaje: 'No tiene permisos para realizar esta acción.'
      });
    }

    next();
  };
};

// ======================================================
// ROLES QUE PUEDEN GESTIONAR HORARIOS
// ======================================================
//
// Este middleware solamente permite entrar al módulo.
//
// La validación de qué usuarios puede administrar cada
// rol se realizará en horario.service.js.
//
// admin:
// Puede administrar todos los horarios.
//
// rrhh:
// Puede administrar horarios de supervisores.
//
// supervisor:
// Puede administrar horarios de empleados.
// No puede administrar su propio horario.
// ======================================================

exports.soloGestionHorarios = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();

  const rolesPermitidos = [
    'admin',
    'rrhh',
    'supervisor'
  ];

  if (!rolesPermitidos.includes(role)) {
    return res.status(403).json({
      mensaje: 'No tiene permisos para gestionar horarios.'
    });
  }

  next();
};