const bcrypt = require('bcrypt');
const userService = require('../services/userService');
const { validateUser } = require('../utils/validators');

// GET
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    res.json(users);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);

    res.status(500).json({
      message: 'Error al obtener usuarios'
    });
  }
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

    await userService.createUser(newUser);

    res.status(201).json({
      message: 'Usuario creado'
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);

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

    await userService.updateUser(id, req.body);

    res.json({
      message: 'Usuario actualizado'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    res.status(500).json({
      message: 'Error servidor'
    });
  }
};

// DELETE
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(id);

    res.json({
      message: 'Usuario eliminado'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);

    res.status(500).json({
      message: 'Error servidor'
    });
  }
};