const userModel = require('../models/userModel');


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

  return await userModel.updateUser(
    id,
    userData
  );

};


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUser = async (id) => {

  return await userModel.deleteUser(id);

};