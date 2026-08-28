// ======================================================
// EXPRESIONES REGULARES
// ======================================================

const nombreValido =
  /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;

const emailValido =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const passwordSegura =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

const normalizarTexto = (value) => {
  return value
    .trim()
    .replace(/\s+/g, ' ');
};


// ======================================================
// NORMALIZAR USUARIO
// ======================================================

exports.normalizeUserData = (user) => {
  const normalizedUser = {
    nombre: normalizarTexto(user.nombre),
    apellido: normalizarTexto(user.apellido),
    email: user.email.trim().toLowerCase(),
    estado: user.estado === true || user.estado === 1,
    rol_id: user.rol_id
  };

  if (
    typeof user.password === 'string' &&
    user.password !== ''
  ) {
    normalizedUser.password = user.password;
  }

  return normalizedUser;
};


// ======================================================
// VALIDAR ID
// ======================================================

exports.validateId = (id) => {
  const parsedId = Number(id);

  if (
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    return {
      field: 'id',
      message: 'El ID del usuario no es válido'
    };
  }

  return null;
};


// ======================================================
// VALIDAR USUARIO
// ======================================================
//
// isEdit:
// false → contraseña obligatoria.
// true  → contraseña opcional.
//
// Si se escribe una contraseña durante la edición,
// debe cumplir la misma política que en la creación.
// ======================================================

exports.validateUser = (
  user,
  isEdit = false
) => {
  if (
    !user ||
    typeof user !== 'object' ||
    Array.isArray(user)
  ) {
    return {
      field: 'form',
      message: 'Los datos enviados no son válidos'
    };
  }

  // ====================================================
  // NOMBRE
  // ====================================================

  if (typeof user.nombre !== 'string') {
    return {
      field: 'nombre',
      message: 'El nombre es obligatorio'
    };
  }

  const nombre = normalizarTexto(user.nombre);

  if (!nombre) {
    return {
      field: 'nombre',
      message: 'El nombre es obligatorio'
    };
  }

  if (nombre.length < 2) {
    return {
      field: 'nombre',
      message: 'El nombre debe tener al menos 2 caracteres'
    };
  }

  if (nombre.length > 30) {
    return {
      field: 'nombre',
      message: 'El nombre no puede superar los 30 caracteres'
    };
  }

  if (!nombreValido.test(nombre)) {
    return {
      field: 'nombre',
      message: 'El nombre solo puede contener letras, espacios, apóstrofes y guiones'
    };
  }

  // ====================================================
  // APELLIDO
  // ====================================================

  if (typeof user.apellido !== 'string') {
    return {
      field: 'apellido',
      message: 'El apellido es obligatorio'
    };
  }

  const apellido = normalizarTexto(user.apellido);

  if (!apellido) {
    return {
      field: 'apellido',
      message: 'El apellido es obligatorio'
    };
  }

  if (apellido.length < 2) {
    return {
      field: 'apellido',
      message: 'El apellido debe tener al menos 2 caracteres'
    };
  }

  if (apellido.length > 30) {
    return {
      field: 'apellido',
      message: 'El apellido no puede superar los 30 caracteres'
    };
  }

  if (!nombreValido.test(apellido)) {
    return {
      field: 'apellido',
      message: 'El apellido solo puede contener letras, espacios, apóstrofes y guiones'
    };
  }

  // ====================================================
  // EMAIL
  // ====================================================

  if (typeof user.email !== 'string') {
    return {
      field: 'email',
      message: 'El email es obligatorio'
    };
  }

  const email = user.email.trim().toLowerCase();

  if (!email) {
    return {
      field: 'email',
      message: 'El email es obligatorio'
    };
  }

  if (email.length > 100) {
    return {
      field: 'email',
      message: 'El email no puede superar los 100 caracteres'
    };
  }

  if (!emailValido.test(email)) {
    return {
      field: 'email',
      message: 'El formato del email no es válido'
    };
  }

  // ====================================================
  // CONTRASEÑA
  // ====================================================

  const passwordWasSent =
    user.password !== undefined &&
    user.password !== '';

  if (!isEdit && !passwordWasSent) {
    return {
      field: 'password',
      message: 'La contraseña es obligatoria'
    };
  }

  if (passwordWasSent) {
    if (typeof user.password !== 'string') {
      return {
        field: 'password',
        message: 'La contraseña no es válida'
      };
    }

    if (
      user.password.length < 8 ||
      user.password.length > 64
    ) {
      return {
        field: 'password',
        message: 'La contraseña debe tener entre 8 y 64 caracteres'
      };
    }

    if (!passwordSegura.test(user.password)) {
      return {
        field: 'password',
        message: 'La contraseña debe incluir mayúscula, minúscula y número'
      };
    }
  }

  // ====================================================
  // ROL
  // ====================================================

  if (
    !Number.isInteger(user.rol_id) ||
    user.rol_id <= 0
  ) {
    return {
      field: 'rol_id',
      message: 'El rol seleccionado no es válido'
    };
  }

  // La existencia del rol se comprobará consultando
  // la base de datos desde el servicio.

  // ====================================================
  // ESTADO
  // ====================================================

  const estadoValido =
    typeof user.estado === 'boolean' ||
    user.estado === 0 ||
    user.estado === 1;

  if (!estadoValido) {
    return {
      field: 'estado',
      message: 'El estado del usuario no es válido'
    };
  }

  return null;
};