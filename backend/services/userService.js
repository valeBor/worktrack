const userModel = require('../models/userModel');


// ======================================================
// CREAR ERROR DE SERVICIO
// ======================================================

const createServiceError = (
  status,
  field,
  message
) => {
  const error = new Error(message);

  error.status = status;
  error.field = field;

  return error;
};


// ======================================================
// OBTENER USUARIOS
// ======================================================

exports.getUsers = async () => {
  return await userModel.getAllUsers();
};


// ======================================================
// CREAR USUARIO
// ======================================================

exports.createUser = async (userData) => {
  const emailExists =
    await userModel.emailExists(
      userData.email
    );

  if (emailExists) {
    throw createServiceError(
      409,
      'email',
      'El email ya está registrado'
    );
  }

  const roleExists =
    await userModel.roleExists(
      userData.rol_id
    );

  if (!roleExists) {
    throw createServiceError(
      400,
      'rol_id',
      'El rol seleccionado no existe'
    );
  }

  return await userModel.createUser(
    userData
  );
};


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

exports.updateUser = async (
  id,
  userData
) => {
  const existingUser =
    await userModel.getById(id);

  if (!existingUser) {
    throw createServiceError(
      404,
      'id',
      'El usuario no existe'
    );
  }

  const emailExists =
    await userModel.emailExists(
      userData.email,
      id
    );

  if (emailExists) {
    throw createServiceError(
      409,
      'email',
      'El email ya está registrado'
    );
  }

  const roleExists =
    await userModel.roleExists(
      userData.rol_id
    );

  if (!roleExists) {
    throw createServiceError(
      400,
      'rol_id',
      'El rol seleccionado no existe'
    );
  }

  return await userModel.updateUser(
    id,
    userData
  );
};


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUser = async (id) => {
  const existingUser =
    await userModel.getById(id);

  if (!existingUser) {
    throw createServiceError(
      404,
      'id',
      'El usuario no existe'
    );
  }

  return await userModel.deleteUser(id);
};