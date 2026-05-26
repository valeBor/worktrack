const bcrypt = require('bcrypt');
const userService = require('../services/userService');
const { validateUser } = require('../utils/validators');



// GET
exports.getUsers = (req, res) => {

  userService.getUsers((err, results) => {

    if (err) {

      return res.status(500).json({
        message: 'Error al obtener usuarios'
      });

    }

    res.json(results);

  });

};



// CREATE
exports.createUser = async (req, res) => {

  try {

    const error = validateUser(req.body);

    if (error) {

      return res.status(400).json({
        message: error
      });

    }

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


    userService.createUser(newUser, (err) => {

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



// UPDATE
exports.updateUser = async (req, res) => {

  try {

    const { id } = req.params;

    const error = validateUser(req.body);

    if (error) {

      return res.status(400).json({
        message: error
      });

    }

    userService.updateUser(id, req.body, (err) => {

      if (err) {

        return res.status(500).json({
          message: 'Error al actualizar'
        });

      }

      res.json({
        message: 'Usuario actualizado'
      });

    });

  } catch (error) {

    res.status(500).json({
      message: 'Error servidor'
    });

  }

};



// DELETE
exports.deleteUser = async (req, res) => {

  try {

    const { id } = req.params;

    userService.deleteUser(id, (err) => {

      if (err) {

        return res.status(500).json({
          message: 'Error al eliminar'
        });

      }

      res.json({
        message: 'Usuario eliminado'
      });

    });

  } catch (error) {

    res.status(500).json({
      message: 'Error servidor'
    });

  }

};