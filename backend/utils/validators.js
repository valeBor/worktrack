exports.validateUser = (user) => {

  if (!user.nombre) {

    return 'Nombre obligatorio';

  }

  if (!user.apellido) {

    return 'Apellido obligatorio';

  }

  if (!user.email) {

    return 'Email obligatorio';

  }

  if (!user.rol_id) {

    return 'Rol obligatorio';

  }

  return null;

};