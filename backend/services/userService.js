const userModel = require('../models/userModel');

exports.getUsers = async () => {
  return await userModel.getAllUsers();
};

exports.createUser = async (userData) => {
  return await userModel.createUser(userData);
};

exports.updateUser = async (id, userData) => {
  return await userModel.updateUser(id, userData);
};

exports.deleteUser = async (id) => {
  return await userModel.deleteUser(id);
};