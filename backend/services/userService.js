const userModel = require('../models/userModel');



// GET
exports.getUsers = (callback) => {

  userModel.getAllUsers(callback);

};



// CREATE
exports.createUser = (userData, callback) => {

  userModel.createUser(userData, callback);

};



// UPDATE
exports.updateUser = (id, userData, callback) => {

  userModel.updateUser(id, userData, callback);

};



// DELETE
exports.deleteUser = (id, callback) => {

  userModel.deleteUser(id, callback);

};