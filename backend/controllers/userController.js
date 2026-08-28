const bcrypt = require('bcrypt');
const userService = require('../services/userService');
const {validateId, validateUser, normalizeUserData} = require('../utils/validators');


// ======================================================
// RESPONDER ERRORES
// ======================================================

const handleUserError = (error, res) => {
  if (error.status) {
    return res.status(error.status).json({
      field: error.field,
      message: error.message
    });
  }

  // Protección adicional ante dos solicitudes
  // simultáneas con el mismo email.
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      field: 'email',
      message: 'El email ya está registrado'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      field: 'rol_id',
      message: 'El rol seleccionado no existe'
    });
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      field: 'form',
      message: 'No se puede eliminar el usuario porque tiene información relacionada'
    });
  }

  console.error('Error interno de usuarios:', error);

  return res.status(500).json({
    field: 'form',
    message: 'Error interno del servidor'
  });
};


// ======================================================
// OBTENER USUARIOS
// ======================================================

exports.getUsers = async (req, res) => {
  try {
    const users =
      await userService.getUsers();

    return res.json(users);
  } catch (error) {
    return handleUserError(error, res);
  }
};


// ======================================================
// CREAR USUARIO
// ======================================================

exports.createUser = async (req, res) => {
  try {
    const validationError =
      validateUser(req.body);

    if (validationError) {
      return res.status(400).json(
        validationError
      );
    }

    const userData =
      normalizeUserData(req.body);

    userData.password =
      await bcrypt.hash(
        userData.password,
        10
      );

    const result =
      await userService.createUser(
        userData
      );

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    return handleUserError(error, res);
  }
};


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

exports.updateUser = async (req, res) => {
  try {
    const {id} = req.params;

    const idError =
      validateId(id);

    if (idError) {
      return res.status(400).json(
        idError
      );
    }

    const validationError =
      validateUser(
        req.body,
        true
      );

    if (validationError) {
      return res.status(400).json(
        validationError
      );
    }

    const userData =
      normalizeUserData(req.body);

    if (userData.password) {
      userData.password =
        await bcrypt.hash(
          userData.password,
          10
        );
    }

    const result =
      await userService.updateUser(
        Number(id),
        userData
      );

    if (result.affectedRows !== 1) {
      return res.status(404).json({
        field: 'id',
        message: 'El usuario no existe'
      });
    }

    return res.json({
      message: 'Usuario actualizado correctamente',
      id: Number(id)
    });
  } catch (error) {
    return handleUserError(error, res);
  }
};


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUser = async (req, res) => {
  try {
    const {id} = req.params;

    const idError =
      validateId(id);

    if (idError) {
      return res.status(400).json(
        idError
      );
    }

    const result =
      await userService.deleteUser(
        Number(id)
      );

    if (result.affectedRows !== 1) {
      return res.status(404).json({
        field: 'id',
        message: 'El usuario no existe'
      });
    }

    return res.json({
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    return handleUserError(error, res);
  }
};