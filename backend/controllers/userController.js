const bcrypt = require('bcrypt');

const userModel = require('../models/userModel');



// GET
exports.getUsers = (req, res) => {

  userModel.getAllUsers((err, results) => {

    if (err) {

      return res.status(500).json({
        message: 'Error al obtener usuarios'
      });

    }

    res.json(results);

  });

};




// POST
exports.createUser = async (req, res) => {

  try {

    const {
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    } = req.body;


    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {

      nombre,
      apellido,
      email,
      password: hashedPassword,
      estado,
      rol_id

    };


    userModel.createUser(newUser, (err, result) => {

      if (err) {

        return res.status(500).json({
          message: 'Error al crear usuario'
        });

      }

      res.status(201).json({
        message: 'Usuario creado'
      });

    });

  } catch (error) {

    res.status(500).json({
      message: 'Error servidor'
    });

  }

};




// PUT
exports.updateUser = (req, res) => {

  const { id } = req.params;

  userModel.updateUser(id, req.body, (err, result) => {

    if (err) {

      return res.status(500).json({
        message: 'Error al actualizar'
      });

    }

    res.json({
      message: 'Usuario actualizado'
    });

  });

};




// DELETE
exports.deleteUser = (req, res) => {

  const { id } = req.params;

  userModel.deleteUser(id, (err, result) => {

    if (err) {

      return res.status(500).json({
        message: 'Error al eliminar'
      });

    }

    res.json({
      message: 'Usuario eliminado'
    });

  });

};